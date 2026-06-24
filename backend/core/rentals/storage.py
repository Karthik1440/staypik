"""
Custom Django storage backend for ImageKit.io.
"""
import os
import requests
from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from django.conf import settings
from imagekitio import ImageKit

class ImageKitStorage(Storage):
    def __init__(self, **kwargs):
        super().__init__()
        # Retrieve credentials from settings or environment
        private_key = getattr(settings, 'IMAGEKIT_PRIVATE_KEY', os.getenv('IMAGEKIT_PRIVATE_KEY'))
        public_key = getattr(settings, 'IMAGEKIT_PUBLIC_KEY', os.getenv('IMAGEKIT_PUBLIC_KEY'))
        url_endpoint = getattr(settings, 'IMAGEKIT_URL_ENDPOINT', os.getenv('IMAGEKIT_URL_ENDPOINT'))

        if not private_key or not public_key or not url_endpoint:
            raise ValueError("ImageKit credentials (IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_URL_ENDPOINT) must be set.")

        self.imagekit = ImageKit(
            private_key=private_key
        )
        self.url_endpoint = url_endpoint.rstrip('/') + '/'

    def _open(self, name, mode='rb'):
        url = self.url(name)
        response = requests.get(url)
        response.raise_for_status()
        return ContentFile(response.content, name=name)

    def _save(self, name, content):
        # Split name into folder and filename
        folder, filename = os.path.split(name)
        folder_path = f"/{folder}" if folder else "/"
        
        # Read content bytes
        content_bytes = content.read()
        
        # Upload using ImageKit SDK
        upload_response = self.imagekit.files.upload(
            file=content_bytes,
            file_name=filename,
            use_unique_file_name=True,
            folder=folder_path
        )
        
        # Access file_path attribute from ImageKit response
        file_path = getattr(upload_response, 'file_path', None)
        if not file_path and isinstance(upload_response, dict):
            file_path = upload_response.get('file_path')
            
        if not file_path:
            raw_res = getattr(upload_response, 'response_metadata', None)
            if raw_res and hasattr(raw_res, 'raw'):
                file_path = raw_res.raw.get('filePath')
        
        if not file_path:
            raise IOError("Failed to retrieve filePath from ImageKit upload response.")

        # Remove leading slash to match Django's relative storage conventions
        return file_path.lstrip('/')

    def url(self, name):
        # Return absolute URL to the file
        return f"{self.url_endpoint}{name.lstrip('/')}"

    def exists(self, name):
        return False
