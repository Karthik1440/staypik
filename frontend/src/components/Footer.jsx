import { Link } from 'react-router-dom';
import { Heart, HelpCircle, Shield, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="hidden md:block bg-gradient-to-b from-slate-900 to-slate-950 text-slate-400 border-t border-slate-800">
      {/* Desktop Footer */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Column 1: Brand & About */}
          <div className="space-y-4 text-left">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-black tracking-tight text-white">
                Stay<span className="text-amber-500">pik</span>
              </span>
            </Link>
            <p className="text-xs font-semibold leading-relaxed text-slate-400">
              Find and book verified PG accommodations, co-living spaces, and long-term rentals. Experience seamless hosting and secure digital rent tracking.
            </p>
            {/* Social Icons */}
            <div className="flex space-x-3.5 pt-2">
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-amber-600 text-white flex items-center justify-center transition-all duration-350 shadow-inner hover:scale-110" aria-label="Facebook">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z" />
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-amber-600 text-white flex items-center justify-center transition-all duration-350 shadow-inner hover:scale-110" aria-label="Twitter">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-amber-600 text-white flex items-center justify-center transition-all duration-350 shadow-inner hover:scale-110" aria-label="Instagram">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-amber-600 text-white flex items-center justify-center transition-all duration-350 shadow-inner hover:scale-110" aria-label="LinkedIn">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Discover */}
          <div className="space-y-4 text-left">
            <h4 className="text-xs font-black tracking-wider text-white uppercase">Discover</h4>
            <ul className="space-y-2.5 text-xs font-bold">
              <li>
                <Link to="/" className="hover:text-amber-500 transition-colors">Explore Premium PGs</Link>
              </li>
              <li>
                <Link to="/?focusSearch=true" className="hover:text-amber-500 transition-colors">Search Localities</Link>
              </li>
              <li>
                <Link to="/saved" className="hover:text-amber-500 transition-colors">My Saved Listings</Link>
              </li>
              <li>
                <Link to="/bookings" className="hover:text-amber-500 transition-colors">Visits History</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Hosting & Partners */}
          <div className="space-y-4 text-left">
            <h4 className="text-xs font-black tracking-wider text-white uppercase">Hosting</h4>
            <ul className="space-y-2.5 text-xs font-bold">
              <li>
                <Link to="/profile" className="hover:text-amber-500 transition-colors">Register as Host</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-amber-500 transition-colors">Host Dashboard</Link>
              </li>
              <li>
                <Link to="/properties" className="hover:text-amber-500 transition-colors">Manage Rooms</Link>
              </li>
              <li>
                <Link to="/tenants" className="hover:text-amber-500 transition-colors">Tenant Roster</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Support */}
          <div className="space-y-4 text-left">
            <h4 className="text-xs font-black tracking-wider text-white uppercase">Contact & Support</h4>
            <ul className="space-y-3 text-xs font-semibold">
              <li className="flex items-center space-x-2.5">
                <Mail size={14} className="text-amber-500 flex-shrink-0" />
                <span className="truncate">support@staypik.com</span>
              </li>

            </ul>
          </div>

        </div>

        {/* Divider */}
        <hr className="border-slate-800 my-8" />

        {/* Footer Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-black tracking-wider uppercase text-slate-500">
          <div>
            © {new Date().getFullYear()} Staypik  Inc. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/terms-privacy" className="hover:text-amber-500 transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link to="/terms-privacy" className="hover:text-amber-500 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <span></span>
              <span></span>
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      <div className="block md:hidden py-8 px-6 text-center space-y-4">
        <Link to="/" className="flex items-center justify-center space-x-2">
          <span className="text-xl font-black tracking-tight text-white">
            Stay<span className="text-amber-500">pik</span>
          </span>
        </Link>
        <p className="text-[10px] font-semibold leading-relaxed max-w-xs mx-auto text-slate-400">
          Find and book PGs, co-living spaces, and long-term rentals.
        </p>

        {/* Simple Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
          <Link to="/terms-privacy" className="hover:text-amber-500 transition-colors">Terms</Link>
          <span>•</span>
          <Link to="/terms-privacy" className="hover:text-amber-500 transition-colors">Privacy</Link>
          <span>•</span>
          <Link to="/saved" className="hover:text-amber-500 transition-colors">Saved</Link>
          <span>•</span>
          <Link to="/bookings" className="hover:text-amber-500 transition-colors">Visits</Link>
        </div>

        {/* Contact info */}
        <div className="text-[9px] font-semibold text-slate-500">
          <span>support@staypik.com </span>
        </div>

        <div className="text-[9px] font-bold text-slate-500 pt-3 border-t border-slate-800/60 max-w-xs mx-auto">
          © {new Date().getFullYear()} Staypik Inc.
        </div>
      </div>
    </footer>
  );
}
