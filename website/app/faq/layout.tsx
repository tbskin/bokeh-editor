import { SiteHeader } from "@/components/SiteHeader";

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
