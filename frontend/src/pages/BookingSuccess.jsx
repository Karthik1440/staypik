import { useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, ShieldCheck, MessageCircle, Home, Calendar, Phone, ArrowRight, Clipboard
} from 'lucide-react';

export default function BookingSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const bookingState = location.state || {
    bookingId: 'PG12345678',
    pgName: 'Maple Living PG',
    roomType: 'Single Sharing',
    bedName: 'Bed A',
    visitDate: '20 May 2026',
    visitTime: '11:00 AM'
  };

  const whatsAppLink = `https://wa.me/919876543210?text=Hi, my visit to ${bookingState.pgName} is scheduled for ${bookingState.visitDate} at ${bookingState.visitTime}. Booking ID: ${bookingState.bookingId}.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingState.bookingId);
    alert('Booking ID copied to clipboard!');
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-12 text-left animate-fadeIn">
      {/* Success Banner */}
      <div className="bg-emerald-50 py-12 px-6 text-center space-y-4 rounded-b-3xl border-b border-emerald-100 shadow-sm relative overflow-hidden">
        {/* Confetti decoration mock */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25 animate-scaleIn">
          <CheckCircle size={36} className="fill-none stroke-current" />
        </div>
        
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Visit Booked!</h2>
          <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto leading-normal">
            Your visit has been scheduled successfully.
          </p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Visit Details Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Visit Details</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400">PG Name</span>
              <span className="font-extrabold text-slate-700">{bookingState.pgName}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400">Room & Bed</span>
              <span className="font-extrabold text-slate-700">{bookingState.roomType} - {bookingState.bedName}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400">Date & Time</span>
              <span className="font-extrabold text-slate-700">{bookingState.visitDate}, {bookingState.visitTime}</span>
            </div>
            
            <hr className="border-slate-50 my-1" />

            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400">Booking ID</span>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-slate-800 font-mono tracking-wider">{bookingState.bookingId}</span>
                <button 
                  onClick={copyToClipboard}
                  className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition"
                  title="Copy ID"
                >
                  <Clipboard size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Callout Panel */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-start space-x-3 text-[11px] font-semibold text-amber-800 leading-normal">
          <ShieldCheck size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
          <p>
            Our team will confirm your visit shortly. <br />
            You will receive a call from the owner.
          </p>
        </div>

        {/* What's Next List */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">What's Next?</h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-6 h-6 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                1
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-xs font-extrabold text-slate-800">Owner Confirmation</p>
                <p className="text-[10px] font-bold text-slate-400">You will get a call from the owner to confirm your visit.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-6 h-6 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                2
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-xs font-extrabold text-slate-800">Visit and Explore</p>
                <p className="text-[10px] font-bold text-slate-400">Visit the PG at the scheduled time and explore the rooms.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-6 h-6 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                3
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-xs font-extrabold text-slate-800">Confirm Stay</p>
                <p className="text-[10px] font-bold text-slate-400">If you like the PG, finalize the move-in process directly with the owner.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="space-y-3 pt-2">
          <a 
            href={whatsAppLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 rounded-2xl bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-black shadow-md transition flex items-center justify-center space-x-2"
          >
            <MessageCircle size={16} />
            <span>Chat on WhatsApp</span>
          </a>

          <button 
            onClick={() => navigate('/')}
            className="w-full py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-black shadow-sm transition flex items-center justify-center space-x-2"
          >
            <Home size={14} />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
