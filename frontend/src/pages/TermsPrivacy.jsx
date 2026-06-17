import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Lock, Globe } from 'lucide-react';

export default function TermsPrivacy() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn py-6 px-4">
      {/* Header Back Button */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200/60 shadow-sm text-slate-600 hover:text-amber-700 transition active:scale-95"
          title="Go Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Terms & Privacy</h2>
          <p className="text-sm font-semibold text-slate-400 mt-1">Last Updated: June 15, 2026</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-slate-100 rounded-[32px] shadow-md shadow-slate-100/40 p-6 sm:p-10 space-y-10">
        
        {/* Intro Section */}
        <section className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
            <Globe size={13} />
            <span>Staypik Platform Agreement</span>
          </div>
          <h3 className="text-xl font-bold text-slate-800">1. Welcome to Staypik</h3>
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            Welcome to Staypik ("Platform", "we", "us", or "our"). By accessing or using our website and services, you agree to comply with and be bound by the following Terms of Service and Privacy Policy. If you do not agree, please do not use our services.
          </p>
        </section>

        {/* Section 2: User Accounts */}
        <section className="space-y-4 pt-6 border-t border-slate-100">
          <div className="flex items-center space-x-2 text-slate-800">
            <FileText size={20} className="text-amber-700" />
            <h3 className="text-xl font-bold">2. User Accounts & Registration</h3>
          </div>
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            To access certain features of the Platform (such as booking visits or listing properties), you must register and maintain a secure account. You agree to provide accurate, current, and complete information, and to keep this information updated at all times (including your full name and profile image).
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-500 font-semibold space-y-2">
            <li>You are responsible for safeguarding your login credentials.</li>
            <li>You must notify us immediately of any unauthorized use of your account.</li>
            <li>We reserve the right to suspend accounts that violate safety protocols or display false information.</li>
          </ul>
        </section>

        {/* Section 3: Booking & Visits */}
        <section className="space-y-4 pt-6 border-t border-slate-100">
          <div className="flex items-center space-x-2 text-slate-800">
            <Shield size={20} className="text-amber-700" />
            <h3 className="text-xl font-bold">3. Booking & Visit Requests</h3>
          </div>
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            Staypik helps connect tenants with PG and accommodation owners. Booking requests made on Staypik are visit schedules and booking reserves:
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-500 font-semibold space-y-2">
            <li>Visit requests are subject to confirmation by the property host.</li>
            <li>Staypik does not own or operate properties listed on the Platform and is not responsible for the physical state of the premises.</li>
            <li>Users must adhere to the rules, safety instructions, and payment conditions set by respective accommodation hosts.</li>
          </ul>
        </section>

        {/* Section 4: Privacy Policy */}
        <section className="space-y-4 pt-6 border-t border-slate-100">
          <div className="flex items-center space-x-2 text-slate-800">
            <Lock size={20} className="text-amber-700" />
            <h3 className="text-xl font-bold">4. Privacy Policy & Data Collection</h3>
          </div>
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            Your privacy is crucial to us. This policy outlines what data we collect, why we collect it, and how we protect it:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-sm font-bold text-slate-700 mb-1">Information We Collect</h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                We collect personal registration details (name, email, password), profile images for verification, location coordinates (if geolocation sorting is used), and visit request choices.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-sm font-bold text-slate-700 mb-1">How We Use Information</h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                To coordinate visit bookings between tenants and hosts, display customized nearby listings based on proximity, verify identity badges, and provide localized support.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Contact Info */}
        <section className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100/60 space-y-3">
          <h4 className="text-sm font-bold text-amber-900">Questions or Concerns?</h4>
          <p className="text-xs text-amber-800 font-semibold leading-relaxed">
            If you have any questions about our Terms & Privacy policy, please contact our support department at support@staypik.com or submit a ticket through the Contact Support tab in your profile.
          </p>
        </section>

      </div>
    </div>
  );
}
