import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

export default function DashboardPage() {
  const navigate = useNavigate()
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-10"
    >
      {/* Hero Title Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-slate-900">Executive Sanctuary</h2>
          <p className="text-slate-500 mt-2 font-body">Welcome back, Leader. Here is your community's performance today.</p>
        </div>
        <button className="flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-95">
          <span className="material-symbols-outlined">download</span>
          <span>Export Data</span>
        </button>
      </section>

      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] group hover:translate-y-[-4px] transition-transform">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/5 rounded-lg text-primary">
              <span className="material-symbols-outlined">groups</span>
            </div>
            <span className="text-[10px] font-bold bg-primary-fixed/30 text-primary-container px-2 py-1 rounded-full">+12.4%</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Active Learners</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">14,285</h3>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] group hover:translate-y-[-4px] transition-transform">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary/5 rounded-lg text-secondary">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Revenue</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">$42,890</h3>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] group hover:translate-y-[-4px] transition-transform">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary/5 rounded-lg text-tertiary">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Avg. Completion Rate</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">68.2%</h3>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-tertiary-fixed-dim h-full w-[68%] rounded-full"></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] group hover:translate-y-[-4px] transition-transform">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-error/5 rounded-lg text-error">
              <span className="material-symbols-outlined">confirmation_number</span>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Support Tickets</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">14</h3>
          <p className="text-[10px] font-bold text-error mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            High Priority (3)
          </p>
        </div>
      </section>

      {/* Middle Section: Asymmetric Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Chart Card (66%) */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-xl font-bold text-slate-900 font-headline">Community Activity Overview</h4>
              <p className="text-sm text-slate-500">Real-time engagement trends and discussion metrics.</p>
            </div>
            <div className="flex gap-8">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Forum Topics</p>
                <p className="text-lg font-bold text-secondary">342</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Engagement Rate</p>
                <p className="text-lg font-bold text-primary-fixed-dim">24.8%</p>
              </div>
            </div>
          </div>
          {/* Decorative Chart Area */}
          <div className="relative h-[280px] w-full bg-surface-container-low rounded-xl flex items-end justify-between p-4 overflow-hidden">
            <div className="absolute inset-0 flex flex-col justify-between p-6 opacity-10">
              <div className="w-full h-[1px] bg-slate-400"></div>
              <div className="w-full h-[1px] bg-slate-400"></div>
              <div className="w-full h-[1px] bg-slate-400"></div>
              <div className="w-full h-[1px] bg-slate-400"></div>
            </div>
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <path d="M0 220 Q 150 120, 300 180 T 600 80 T 900 140 L 900 300 L 0 300 Z" fill="url(#grad1)" opacity="0.4" stroke="none"></path>
              <path d="M0 220 Q 150 120, 300 180 T 600 80 T 900 140" fill="none" stroke="#415e94" strokeLinecap="round" strokeWidth="4"></path>
              <path d="M0 250 Q 200 200, 400 240 T 700 150 T 900 190" fill="none" stroke="#87C744" strokeDasharray="8 4" strokeLinecap="round" strokeWidth="4"></path>
              <defs>
                <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#415e94", stopOpacity: 0.2 }}></stop>
                  <stop offset="100%" style={{ stopColor: "#415e94", stopOpacity: 0 }}></stop>
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute bottom-4 left-6 right-6 flex justify-between text-[10px] font-bold text-slate-400">
              <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
            </div>
          </div>
        </div>

        {/* Right: Toolkit Card (33%) */}
        <div className="bg-secondary p-8 rounded-xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-secondary-container">construction</span>
              <h4 className="text-xl font-bold font-headline">Management Toolkit</h4>
            </div>
            <p className="text-secondary-container text-sm leading-relaxed mb-8">Execute core administration tasks with direct oversight.</p>
            <div className="space-y-3">
              <button onClick={() => navigate("/dashboard/courses/create")} className="w-full flex items-center justify-between group bg-white/10 hover:bg-white/20 px-4 py-4 rounded-xl transition-all">
                <span className="font-semibold text-sm">Create New Course</span>
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">chevron_right</span>
              </button>
              <button className="w-full flex items-center justify-between group bg-white/10 hover:bg-white/20 px-4 py-4 rounded-xl transition-all">
                <span className="font-semibold text-sm">Send Announcement</span>
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">chevron_right</span>
              </button>
              <button className="w-full flex items-center justify-between group bg-white/10 hover:bg-white/20 px-4 py-4 rounded-xl transition-all">
                <span className="font-semibold text-sm">Generate System Report</span>
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">chevron_right</span>
              </button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
            <div className="flex items-center justify-between text-xs text-secondary-container font-semibold">
              <span>SYSTEM STATUS</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-primary-fixed rounded-full animate-pulse"></span> OPERATIONAL</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Recent Enrollments (66%) */}
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] overflow-hidden">
          <div className="px-8 py-6 border-b border-surface-container/30 flex justify-between items-center">
            <h4 className="text-lg font-bold text-slate-900">Recent Enrollments</h4>
            <button className="text-sm font-bold text-secondary hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">User</th>
                  <th className="px-4 py-4">Course Title</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-8 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/20">
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <img alt="User Avatar" className="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgDJQnQX1nT6QzIGasJI2M9bZl9O0328Mm8RbXZH2UDFgtfjwT859ZgAdnHz-8shGErr_IaWl_2WEVjnDPsd4xt785Kq-bd-ewLLfXzO50mMiDPqliKprcfCvtz_v9QKnX5KrS_sQ8s5Vydw249x_XszURKSeDe9JeyY4Du88waK1szb3f0Jw6eBTbbeq6qvAtEHzF5MAPsRPFYE5iVgVMFXvj_fVS1rcs0dbERK7QMQgyVqNP6covRf-UMD6JBjw9_1vUDtnsE4lW"/>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Elena Petrov</p>
                        <p className="text-[10px] text-slate-400">elena.p@global.com</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-slate-700">Strategic Mindfulness</p>
                    <p className="text-[10px] text-tertiary">LEVEL: MASTER</p>
                  </td>
                  <td className="px-4 py-4 text-xs font-medium text-slate-500">Oct 24, 2023</td>
                  <td className="px-8 py-4 text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary-fixed/20 text-on-primary-fixed-variant text-[10px] font-bold">COMPLETED</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <img alt="User Avatar" className="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOaczlMl5fadlqnc-TiNauzenF9xdpH9mM2J4BqHcVL9nkR8oJ_pJFWyo2QPbffuYOB7somknKpYfnfoOyp6HOH5MegGw6tIRRQMsX1eD1c4gq7qdjUncxhtES5AhUPAtKf_SYaNbyTd0GcJ6nYoDYtphLXwuPOrFu30hAPtVHA53h8oX6Tt-sY2qXs-s-HYIrveJ_GxBE-dmz0RLRFYs0k1ReWnkajk6uVT1OoFLYGGD4NlNlyALyJzUsgYUAHcSkTi1Sxb4MIirA"/>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Marcus Chen</p>
                        <p className="text-[10px] text-slate-400">m.chen@tech.org</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-slate-700">Digital Flow States</p>
                    <p className="text-[10px] text-secondary">LEVEL: INTERMEDIATE</p>
                  </td>
                  <td className="px-4 py-4 text-xs font-medium text-slate-500">Oct 23, 2023</td>
                  <td className="px-8 py-4 text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-secondary-container/30 text-on-secondary-container text-[10px] font-bold">IN PROGRESS</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">JD</div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Julian Darko</p>
                        <p className="text-[10px] text-slate-400">j.darko@creative.co</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-slate-700">Zen Architectures</p>
                    <p className="text-[10px] text-primary">LEVEL: BEGINNER</p>
                  </td>
                  <td className="px-4 py-4 text-xs font-medium text-slate-500">Oct 22, 2023</td>
                  <td className="px-8 py-4 text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-surface-container-highest text-slate-500 text-[10px] font-bold uppercase">Pending</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Cards (33%) */}
        <div className="flex flex-col gap-6">
          <div className="bg-primary-container p-6 rounded-xl relative overflow-hidden text-white flex flex-col justify-between min-h-[180px]">
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <span className="material-symbols-outlined text-4xl">workspace_premium</span>
            </div>
            <div className="relative z-10">
              <span className="inline-block px-2 py-0.5 bg-primary-fixed text-on-primary-fixed text-[8px] font-bold tracking-widest rounded mb-3 uppercase">Trending Course</span>
              <h5 className="text-base font-bold font-headline leading-tight">The Zen Leader: Harmonizing High Output</h5>
            </div>
            <button className="mt-4 relative z-10 bg-white text-primary-container font-bold text-xs py-2.5 rounded-lg hover:bg-slate-100 transition-colors uppercase tracking-wide">Audit Content</button>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-secondary-container/20 text-secondary p-2 rounded-lg">
                <span className="material-symbols-outlined text-lg">calendar_month</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Upcoming Live Event</p>
                <p className="text-sm font-bold text-slate-900">Oct 28 • Masterclass</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Scaling empathy in remote high-stakes teams.</p>
          </div>

          <div className="bg-tertiary-container p-5 rounded-xl text-on-tertiary-container">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-tertiary-fixed text-lg">auto_awesome</span>
              <p className="text-[10px] font-bold uppercase tracking-widest">AI Insight</p>
            </div>
            <p className="text-xs leading-relaxed">System predicts a <span className="text-tertiary-fixed font-bold">12% churn risk</span> in segment "Intermediate Learners" next week. Recommend launching engagement campaign.</p>
          </div>
        </div>
      </section>
    </motion.div>
  )
}

