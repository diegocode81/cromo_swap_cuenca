"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string };
};

export function ChatClient({
  conversationId,
  currentUserId,
  reportedUserId
}: {
  conversationId: string;
  currentUserId: string;
  reportedUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [reportMessage, setReportMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`/api/messages?conversationId=${conversationId}`);
    if (!response.ok) return;
    const data = await response.json();
    setMessages(data.messages);
    await fetch("/api/messages/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId })
    });
  }, [conversationId]);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, 8000);
    return () => window.clearInterval(id);
  }, [conversationId, load]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const content = String(form.get("content") ?? "").trim();
    if (!content) return;
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, content })
    });
    if (response.ok) {
      formElement.reset();
      await load();
    }
  }

  async function report(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const reason = String(form.get("reason") ?? "").trim();
    if (!reason) return;
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, reportedUserId, reason })
    });
    setReportMessage(response.ok ? "Reporte enviado para revision." : "No se pudo enviar el reporte.");
    if (response.ok) formElement.reset();
  }

  return (
    <div className="space-y-4">
      <div className="card flex min-h-[65vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto">
          {messages.map((message) => {
            const mine = message.senderId === currentUserId;
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[82%] rounded-lg px-4 py-3 ${mine ? "bg-field text-white" : "bg-slate-100"}`}
                >
                  <p className="text-xs font-semibold opacity-80">{message.sender.name}</p>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={send} className="mt-4 flex gap-2">
          <input name="content" placeholder="Escribe un mensaje" maxLength={1000} />
          <button className="btn-primary" type="submit">
            Enviar
          </button>
        </form>
      </div>
      <form onSubmit={report} className="card space-y-3">
        <p className="font-black">Reportar conversacion</p>
        <textarea name="reason" placeholder="Describe el problema" minLength={5} required />
        <button className="btn-secondary" type="submit">Enviar reporte</button>
        {reportMessage ? <p className="text-sm text-slate-600">{reportMessage}</p> : null}
      </form>
    </div>
  );
}
