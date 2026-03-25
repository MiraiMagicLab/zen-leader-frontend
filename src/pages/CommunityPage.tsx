import { motion } from "framer-motion"
import { useState } from "react"

const members = [
  {
    id: 1,
    name: "Elena Petrov",
    email: "elena.p@global.com",
    role: "Master",
    status: "Active",
    joined: "Jan 12, 2023",
    posts: 142,
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAgDJQnQX1nT6QzIGasJI2M9bZl9O0328Mm8RbXZH2UDFgtfjwT859ZgAdnHz-8shGErr_IaWl_2WEVjnDPsd4xt785Kq-bd-ewLLfXzO50mMiDPqliKprcfCvtz_v9QKnX5KrS_sQ8s5Vydw249x_XszURKSeDe9JeyY4Du88waK1szb3f0Jw6eBTbbeq6qvAtEHzF5MAPsRPFYE5iVgVMFXvj_fVS1rcs0dbERK7QMQgyVqNP6covRf-UMD6JBjw9_1vUDtnsE4lW",
  },
  {
    id: 2,
    name: "Marcus Chen",
    email: "m.chen@tech.org",
    role: "Intermediate",
    status: "Active",
    joined: "Mar 5, 2023",
    posts: 87,
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOaczlMl5fadlqnc-TiNauzenF9xdpH9mM2J4BqHcVL9nkR8oJ_pJFWyo2QPbffuYOB7somknKpYfnfoOyp6HOH5MegGw6tIRRQMsX1eD1c4gq7qdjUncxhtES5AhUPAtKf_SYaNbyTd0GcJ6nYoDYtphLXwuPOrFu30hAPtVHA53h8oX6Tt-sY2qXs-s-HYIrveJ_GxBE-dmz0RLRFYs0k1ReWnkajk6uVT1OoFLYGGD4NlNlyALyJzUsgYUAHcSkTi1Sxb4MIirA",
  },
  {
    id: 3,
    name: "Julian Darko",
    email: "j.darko@creative.co",
    role: "Beginner",
    status: "Inactive",
    joined: "Jun 18, 2023",
    posts: 12,
    avatar: null,
  },
  {
    id: 4,
    name: "Sophia Müller",
    email: "s.muller@design.de",
    role: "Master",
    status: "Active",
    joined: "Feb 28, 2023",
    posts: 209,
    avatar: null,
  },
  {
    id: 5,
    name: "Ravi Patel",
    email: "ravi.p@startup.io",
    role: "Intermediate",
    status: "Pending",
    joined: "Sep 3, 2023",
    posts: 34,
    avatar: null,
  },
  {
    id: 6,
    name: "Amara Osei",
    email: "a.osei@africa.net",
    role: "Beginner",
    status: "Active",
    joined: "Oct 1, 2023",
    posts: 7,
    avatar: null,
  },
]

const recentDiscussions = [
  {
    id: 1,
    title: "How to maintain focus during remote work?",
    author: "Elena Petrov",
    category: "Mindfulness",
    replies: 24,
    views: 312,
    time: "2h ago",
    pinned: true,
  },
  {
    id: 2,
    title: "Best practices for building high-performance teams",
    author: "Marcus Chen",
    category: "Leadership",
    replies: 18,
    views: 214,
    time: "5h ago",
    pinned: false,
  },
  {
    id: 3,
    title: "Navigating difficult conversations at work",
    author: "Sophia Müller",
    category: "Communication",
    replies: 41,
    views: 508,
    time: "1d ago",
    pinned: false,
  },
  {
    id: 4,
    title: "Sharing my experience with the Zen Leader course",
    author: "Ravi Patel",
    category: "Course Review",
    replies: 9,
    views: 98,
    time: "2d ago",
    pinned: false,
  },
]

const categoryColors: Record<string, string> = {
  Mindfulness: "bg-tertiary/10 text-tertiary",
  Leadership: "bg-secondary/10 text-secondary",
  Communication: "bg-primary/10 text-primary",
  "Course Review": "bg-primary-fixed/20 text-on-primary-fixed-variant",
}

const statusStyles: Record<string, string> = {
  Active: "bg-primary-fixed/20 text-on-primary-fixed-variant",
  Inactive: "bg-surface-container-highest text-slate-500",
  Pending: "bg-secondary-container/30 text-on-secondary-container",
}

const roleStyles: Record<string, string> = {
  Master: "text-tertiary",
  Intermediate: "text-secondary",
  Beginner: "text-primary",
}

export default function CommunityPage() {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<"members" | "discussions">("members")

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-10"
    >
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-slate-900">
            Community Hub
          </h2>
          <p className="text-slate-500 mt-2 font-body">
            Manage members, moderate discussions, and track community health.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 border border-slate-200 text-slate-700 px-5 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-all active:scale-95">
            <span className="material-symbols-outlined text-lg">filter_list</span>
            <span>Filter</span>
          </button>
          <button className="flex items-center gap-2 bg-secondary text-white px-5 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-95">
            <span className="material-symbols-outlined text-lg">person_add</span>
            <span>Invite Member</span>
          </button>
        </div>
      </section>

      {/* Stats Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Members",
            value: "3,842",
            icon: "groups",
            color: "text-primary",
            bg: "bg-primary/5",
            badge: "+8.3%",
            badgeColor: "bg-primary-fixed/30 text-primary-container",
          },
          {
            label: "Active This Week",
            value: "1,204",
            icon: "person_check",
            color: "text-secondary",
            bg: "bg-secondary/5",
            badge: "+5.1%",
            badgeColor: "bg-secondary-container/30 text-on-secondary-container",
          },
          {
            label: "Open Discussions",
            value: "342",
            icon: "forum",
            color: "text-tertiary",
            bg: "bg-tertiary/5",
            badge: "+22",
            badgeColor: "bg-tertiary-fixed/30 text-on-tertiary-container",
          },
          {
            label: "Pending Approvals",
            value: "17",
            icon: "pending_actions",
            color: "text-error",
            bg: "bg-error/5",
            badge: "Needs Review",
            badgeColor: "bg-error/10 text-error",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] hover:translate-y-[-4px] transition-transform"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 ${stat.bg} rounded-lg ${stat.color}`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${stat.badgeColor}`}>
                {stat.badge}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {stat.label}
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </section>

      {/* Tabs + Search */}
      <section className="bg-surface-container-lowest rounded-xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)] overflow-hidden">
        <div className="px-8 py-5 border-b border-surface-container/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("members")}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "members"
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab("discussions")}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "discussions"
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Discussions
            </button>
          </div>
          {activeTab === "members" && (
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members..."
                className="bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-secondary/20 rounded-xl py-2 pl-10 pr-4 text-sm w-64"
              />
            </div>
          )}
        </div>

        {/* Members Table */}
        {activeTab === "members" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">Member</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4">Posts</th>
                  <th className="px-4 py-4">Joined</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/20">
                {filtered.map((member) => (
                  <tr key={member.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {member.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-900">{member.name}</p>
                          <p className="text-[10px] text-slate-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-bold ${roleStyles[member.role]}`}>
                        {member.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                      {member.posts}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">{member.joined}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${statusStyles[member.status]}`}
                      >
                        {member.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-[18px]">block</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-slate-400 text-sm">
                      No members found for "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Discussions List */}
        {activeTab === "discussions" && (
          <div className="divide-y divide-surface-container/20">
            {recentDiscussions.map((post) => (
              <div
                key={post.id}
                className="px-8 py-5 hover:bg-surface-container-low transition-colors flex items-start gap-4"
              >
                <div className="p-2.5 bg-surface-container rounded-xl mt-0.5">
                  <span className="material-symbols-outlined text-secondary text-[22px]">
                    {post.pinned ? "push_pin" : "chat"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {post.pinned && (
                      <span className="text-[10px] font-bold text-error uppercase">Pinned</span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryColors[post.category] ?? "bg-slate-100 text-slate-500"}`}
                    >
                      {post.category}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate">{post.title}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    by <span className="font-semibold text-slate-600">{post.author}</span> ·{" "}
                    {post.time}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-xs text-slate-400 shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">chat_bubble</span>
                    {post.replies}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    {post.views}
                  </div>
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[16px]">more_vert</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="px-8 py-5 border-t border-surface-container/30 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Showing{" "}
            <span className="font-bold text-slate-600">
              {activeTab === "members" ? filtered.length : recentDiscussions.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-slate-600">
              {activeTab === "members" ? "3,842" : "342"}
            </span>{" "}
            results
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors">
              Previous
            </button>
            <button className="px-4 py-2 rounded-lg bg-secondary text-white text-xs font-bold hover:opacity-90 transition-opacity">
              Next
            </button>
          </div>
        </div>
      </section>

      {/* Bottom Row: Activity + Spotlight */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)]">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-slate-900 font-headline">Recent Activity</h4>
            <button className="text-sm font-bold text-secondary hover:underline">View All</button>
          </div>
          <ol className="relative border-l border-surface-container ml-3 space-y-6">
            {[
              {
                icon: "person_add",
                color: "text-primary bg-primary/10",
                text: "Amara Osei joined the community",
                time: "30 min ago",
              },
              {
                icon: "forum",
                color: "text-secondary bg-secondary/10",
                text: "Marcus Chen started a new discussion",
                time: "2h ago",
              },
              {
                icon: "thumb_up",
                color: "text-tertiary bg-tertiary/10",
                text: "Elena Petrov's post received 50 likes",
                time: "4h ago",
              },
              {
                icon: "report",
                color: "text-error bg-error/10",
                text: "A discussion was flagged for moderation",
                time: "6h ago",
              },
              {
                icon: "workspace_premium",
                color: "text-primary-fixed-dim bg-primary-fixed/20",
                text: "Sophia Müller achieved Master status",
                time: "1d ago",
              },
            ].map((item, i) => (
              <li key={i} className="ml-6">
                <span
                  className={`absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full ${item.color}`}
                >
                  <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                </span>
                <p className="text-sm font-semibold text-slate-700">{item.text}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Spotlight + Quick Actions */}
        <div className="flex flex-col gap-6">
          <div className="bg-secondary p-6 rounded-xl text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary-container mb-4">
                Member Spotlight
              </p>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgDJQnQX1nT6QzIGasJI2M9bZl9O0328Mm8RbXZH2UDFgtfjwT859ZgAdnHz-8shGErr_IaWl_2WEVjnDPsd4xt785Kq-bd-ewLLfXzO50mMiDPqliKprcfCvtz_v9QKnX5KrS_sQ8s5Vydw249x_XszURKSeDe9JeyY4Du88waK1szb3f0Jw6eBTbbeq6qvAtEHzF5MAPsRPFYE5iVgVMFXvj_fVS1rcs0dbERK7QMQgyVqNP6covRf-UMD6JBjw9_1vUDtnsE4lW"
                  alt="Elena Petrov"
                  className="w-12 h-12 rounded-full border-2 border-white/30"
                />
                <div>
                  <p className="font-bold text-sm">Elena Petrov</p>
                  <p className="text-[11px] text-secondary-container">Top Contributor · October</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-[10px] text-secondary-container uppercase tracking-wide">Posts</p>
                  <p className="font-extrabold text-xl">142</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-[10px] text-secondary-container uppercase tracking-wide">Likes</p>
                  <p className="font-extrabold text-xl">1.4k</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-[0px_12px_32px_rgba(31,62,114,0.06)]">
            <h5 className="text-sm font-bold text-slate-900 mb-4 font-headline">Quick Actions</h5>
            <div className="space-y-2">
              {[
                { icon: "campaign", label: "Send Announcement" },
                { icon: "gavel", label: "Moderation Queue (3)" },
                { icon: "download", label: "Export Member List" },
              ].map((action) => (
                <button
                  key={action.label}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-surface-container-low hover:text-slate-900 transition-colors text-sm font-semibold group"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary group-hover:text-secondary">
                    {action.icon}
                  </span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  )
}
