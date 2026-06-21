import { HeroSection } from "@/components/invitation/HeroSection";
import { InvitationSection } from "@/components/invitation/InvitationSection";
import { CountdownSection } from "@/components/invitation/CountdownSection";
import { ScheduleSection } from "@/components/invitation/ScheduleSection";

export default function InvitationPage() {
  return (
    <main>
      <HeroSection />
      <InvitationSection />
      <CountdownSection />
      <ScheduleSection />
    </main>
  );
}
