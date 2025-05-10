
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Phone, User, FileText, Check, AlertCircle, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CampaignCallTester } from "./CampaignCallTester";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  phone: string;
  status: "pending" | "called" | "completed" | "failed";
  notes: string | null;
  call_duration?: string | null;
  call_result?: string | null;
}

interface LeadsTableProps {
  campaignId: string;
  agentId?: string;
  agentName?: string;
}

export function LeadsTable({ campaignId, agentId, agentName }: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCallTester, setShowCallTester] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [campaignId]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at");
        
      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) {
      console.error("Error fetching leads:", err);
      setError(err.message || "Erro ao carregar leads");
    } finally {
      setLoading(false);
    }
  };

  const handleTestCall = (lead: Lead) => {
    setSelectedLead(lead);
    setShowCallTester(true);
  };

  const handleNotesClick = (lead: Lead) => {
    setSelectedLead(lead);
    setNotes(lead.notes || "");
    setShowNotes(true);
  };

  const saveNotes = async () => {
    if (!selectedLead) return;
    
    setSavingNotes(true);
    
    try {
      const { error } = await supabase
        .from("leads")
        .update({ notes })
        .eq("id", selectedLead.id);
        
      if (error) throw error;
      
      // Update local state
      setLeads(leads.map(lead => 
        lead.id === selectedLead.id ? { ...lead, notes } : lead
      ));
      
      toast.success("Notas salvas com sucesso");
      setShowNotes(false);
    } catch (err: any) {
      console.error("Error saving notes:", err);
      toast.error("Erro ao salvar notas");
    } finally {
      setSavingNotes(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">Pendente</Badge>;
      case "called":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0">Chamado</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0">Concluído</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-0">Falhou</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando leads...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-red-500 font-medium">Erro ao carregar leads</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchLeads} variant="outline">Tentar novamente</Button>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-1">Nenhum lead encontrado</h3>
        <p className="text-muted-foreground">
          Esta campanha não possui leads cadastrados.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Resultado</TableHead>
            <TableHead className="w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-700" />
                  {lead.name}
                </div>
              </TableCell>
              <TableCell>{lead.phone}</TableCell>
              <TableCell>{getStatusBadge(lead.status)}</TableCell>
              <TableCell>{lead.call_duration || "-"}</TableCell>
              <TableCell>{lead.call_result || "-"}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Fazer chamada de teste"
                    onClick={() => handleTestCall(lead)}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Adicionar notas"
                    onClick={() => handleNotesClick(lead)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Call Tester Dialog */}
      <Dialog open={showCallTester} onOpenChange={setShowCallTester}>
        <DialogContent className="sm:max-w-[450px]">
          {selectedLead && (
            <CampaignCallTester
              campaignId={campaignId}
              agentId={agentId}
              agentName={agentName}
              phoneNumber={selectedLead.phone}
              leadName={selectedLead.name}
              leadId={selectedLead.id}
              onClose={() => setShowCallTester(false)}
              onCallComplete={fetchLeads}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={showNotes} onOpenChange={setShowNotes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notas para {selectedLead?.name}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Digite suas observações sobre este lead..."
            className="min-h-[150px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotes(false)}>Cancelar</Button>
            <Button 
              onClick={saveNotes}
              disabled={savingNotes}
              className="bg-blue-800 hover:bg-blue-900 text-white"
            >
              {savingNotes ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
