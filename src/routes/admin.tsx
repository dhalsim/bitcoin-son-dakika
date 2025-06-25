import React from 'react';
import type { MetaFunction } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Badge } from '../components/ui/badge';
import { 
  FileText, 
  Settings,
  Users,
  Save,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';

export const meta: MetaFunction = () => {
  return [
    { title: "Yönetim Paneli - Bitcoin Son Dakika" },
    { name: "description", content: "Bitcoin Son Dakika yönetim paneli - İçerik yönetimi, relay ayarları ve editör kontrolü." },
    { name: "robots", content: "noindex, nofollow" },
  ];
};

export default function Admin() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background p-8">
      <h1 className="text-2xl font-bold">Yönetim Paneli</h1>
      <p>Bitcoin Son Dakika - İçerik Yönetimi</p>
    </div>
  );
} 