import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-card border-t border-border p-4 flex flex-col md:flex-row justify-between items-center">
      <p className="text-xs text-muted-foreground">
        &copy; {currentYear} SRPH-MIS Inventory Management System
      </p>
      <div className="mt-2 md:mt-0">
        <Button variant="outline" size="sm" asChild>
          <Link href="/user-manual" className="flex items-center">
            <BookOpen className="h-4 w-4 mr-1" />
            User Manual
          </Link>
        </Button>
      </div>
    </footer>
  );
}
