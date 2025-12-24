"use client";

import { InvitationsTab } from "@/components/custom/invitations-tab";
import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";

export default function InvitationsPage() {
  const { dashboardT } = useDashboardTranslations();

  return (
    <div className="flex flex-col items-center space-y-6 p-2">
      <h1 className="text-2xl font-semibold">
        {dashboardT.invitationsPage.title}
      </h1>
      <Tabs defaultValue="users" className="w-full max-w-4xl flex-1">
        <TabsList className="mx-auto grid w-75 translate-y-1 grid-cols-3">
          <TabsTrigger value="users" className="cursor-pointer">
            {dashboardT.invitationsPage.users}
          </TabsTrigger>
          <TabsTrigger value="course_maintainers" className="cursor-pointer">
            {dashboardT.invitationsPage.courses}
          </TabsTrigger>
          <TabsTrigger value="bucket_maintainers" className="cursor-pointer">
            {dashboardT.invitationsPage.buckets}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <InvitationsTab type="user" />
        </TabsContent>
        <TabsContent value="course_maintainers">
          <InvitationsTab type="course_maintainer" />
        </TabsContent>
        <TabsContent value="bucket_maintainers">
          <InvitationsTab type="bucket_maintainer" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
