"use client";

import { InvitationsTab } from "@/components/custom/invitations-tab";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";

export default function InvitationsPage() {
  return (
    <div className="p-2 flex flex-col space-y-6 items-center">
      <h1 className="text-2xl font-semibold">Invitations</h1>
      <Tabs defaultValue="users" className="flex-1 w-full max-w-4xl">
        <TabsList className="mx-auto grid grid-cols-3 w-[300px] translate-y-1">
          <TabsTrigger value="users" className="cursor-pointer">
            Users
          </TabsTrigger>
          <TabsTrigger value="course_maintainers" className="cursor-pointer">
            Courses
          </TabsTrigger>
          <TabsTrigger value="bucket_maintainers" className="cursor-pointer">
            Buckets
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
