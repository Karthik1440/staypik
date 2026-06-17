import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
from .models import AppUser
import os
import json

def get_firebase_app():
    if not firebase_admin._apps:

        # ✅ 1. Try ENV JSON (production - Render)
        firebase_creds_str = os.getenv("FIREBASE_CREDENTIALS")

        if firebase_creds_str:
            try:
                firebase_creds = json.loads(firebase_creds_str)
                cred = credentials.Certificate(firebase_creds)
                print("Using Firebase from ENV")
            except Exception as e:
                raise Exception(f"Invalid FIREBASE_CREDENTIALS: {str(e)}")

        else:
            # ✅ 2. Optional: Local development only
            cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

            if not cred_path:
                raise Exception("Firebase credentials not configured")

            print("Using Firebase cred path:", cred_path)
            cred = credentials.Certificate(cred_path)

        firebase_admin.initialize_app(cred)

class FirebaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header.startswith('Bearer '):
            return None

        id_token = auth_header.split('Bearer ')[1]

        get_firebase_app()

        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
        except firebase_auth.ExpiredIdTokenError:
            raise AuthenticationFailed('Token has expired.')
        except firebase_auth.InvalidIdTokenError:
            raise AuthenticationFailed('Invalid token.')
        except Exception as e:
            raise AuthenticationFailed(f'Token verification failed: {str(e)}')

        uid = decoded_token['uid']
        email = decoded_token.get('email', '')
        name = decoded_token.get('name') or ''

        user, _ = AppUser.objects.get_or_create(
            firebase_uid=uid,
            defaults={'email': email, 'display_name': name}
        )

        return (user, None)

    def authenticate_header(self, request):
        return 'Bearer realm="api"'