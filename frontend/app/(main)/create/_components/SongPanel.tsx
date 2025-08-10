"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const SongPanel = () => {
  const [mode, setMode] = useState<"simple" | "custom">("simple");

  return (
    <div className="bg-muted/30 flex flex-col w-full border-r lg:w-80 rounded-b-lg">
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4">
        <Tabs
          defaultValue={mode}
          value={mode}
          onValueChange={(value) => setMode(value as "simple" | "custom")}
        >
          <TabsList className="w-full">
            <TabsTrigger value="simple">Simple</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
          <TabsContent value="simple" className="mt-6 space-y-6">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Describe your song</label>
            </div>
          </TabsContent>
          <TabsContent value="password">Change your password here.</TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SongPanel;
