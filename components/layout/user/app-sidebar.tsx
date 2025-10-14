"use client"

import { useSession } from "@/lib/auth-client"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  CommandIcon,
  FileUserIcon,
  Frame,
  GalleryVerticalEnd,
  HeartPulse,
  Map,
  Newspaper,
  PersonStanding,
  PieChart,
  ScanSearch,
  User2Icon,
  Wrench
} from "lucide-react"
import type * as React from "react"

import { NavMain } from "@/components/layout/user/nav-main"
import { NavProjects } from "@/components/layout/user/nav-projects"
import { NavUser } from "@/components/layout/user/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "You",
    email: "@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Exercises",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Sleep Tracker",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Health Tools",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: CommandIcon,
    },
    {
      title: "Exercises",
      url: "/dashboard/exercises",
      icon: PersonStanding,
    },
    {
      title: "Symptom Search",
      url: "/dashboard/symptom-search",
      icon: Bot,
    },
    {
      title: "Medicine Finder",
      url: "/dashboard/medicine-search",
      icon: BookOpen,
    },
    {
      title: "Disease Glossary",
      url: "/dashboard/diseases",
      icon: ScanSearch,
    },
    {
      title: "Personal Notes",
      url: "/dashboard/notes",
      icon: FileUserIcon,
    },
    // {
    //   title: "Medical Conditions",
    //   url: "/dashboard/conditions",
    //   icon: HeartPulse,
    // },
  ],
  projects: [
    {
      name: "Web Map",
      url: "/dashboard/web-map",
      icon: Frame,
    },
    {
      name: "Glossary & FAQs",
      url: "/glossary",
      icon: Map,
    },
    {
      name: "Contact Support",
      url: "/support",
      icon: Wrench,
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser session={session} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
