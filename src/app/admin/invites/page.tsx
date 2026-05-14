"use client";
// app/admin/invites/page.tsx

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { AdminInvitesHeader } from "@/components/sections/admin/invites/AIHeader";
import { AdminInvitesStats } from "@/components/sections/admin/invites/AIStats";
import { AdminInvitesToolbar } from "@/components/sections/admin/invites/AIToolbar";
import { AdminInvitesTable } from "@/components/sections/admin/invites/AITable";
import { AdminInvitesPagination } from "@/components/sections/admin/invites/AIPagination";
import { AdminInvitesEmptyState } from "@/components/sections/admin/invites/AIEmptystate";
import { AdminGenerateInviteModal } from "@/components/sections/admin/invites/modal/AIGenerateModal";
import { LuLoader } from "react-icons/lu";
import { cn } from "../../../lib/utils";

export interface AdminInvite {
  id: string;
  code: string;
  status: "active" | "used" | "expired" | "revoked";
  maxUses: number;
  useCount: number;
  note: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface InviteStats {
  total: number;
  active: number;
  used: number;
  expired: number;
  revoked: number;
}

interface InvitePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 50;

export default function InvitesManagementPage() {
  const { token } = useAuth();

  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [pagination, setPagination] = useState<InvitePagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  const fetchInvites = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      });
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/invites?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load invites");
      const data = await res.json();

      let list: AdminInvite[] = data.invites ?? [];

      // Client-side search — API doesn't support search param yet
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (inv) =>
            inv.code.toLowerCase().includes(q) ||
            (inv.note?.toLowerCase().includes(q) ?? false),
        );
      }

      setInvites(list);
      setPagination(data.pagination ?? null);

      // Derive stats from full list (unfiltered fetch)
      // Re-fetch unfiltered for stats if filtered
      if (!statusFilter && !search) {
        const s: InviteStats = {
          total: data.pagination?.total ?? 0,
          active: 0,
          used: 0,
          expired: 0,
          revoked: 0,
        };
        list.forEach((inv) => {
          if (inv.status in s)
            (s as never as Record<string, number>)[inv.status]++;
        });
        setStats(s);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, statusFilter, search]);

  // Separate stats fetch — always unfiltered
  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/invites?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const s: InviteStats = {
        total: data.pagination?.total ?? 0,
        active: 0,
        used: 0,
        expired: 0,
        revoked: 0,
      };
      (data.invites ?? []).forEach((inv: AdminInvite) => {
        if (inv.status in s)
          (s as never as Record<string, number>)[inv.status]++;
      });
      s.total = data.pagination?.total ?? s.total;
      setStats(s);
    } catch {
      /* silently fail */
    }
  }, [token]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleMutation = () => {
    fetchInvites();
    fetchStats();
  };

  const handleRevoke = async (id: string) => {
    if (!token) return;
    await fetch(`/api/admin/invites/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "revoke" }),
    });
    handleMutation();
  };

  if (loading && invites.length === 0) {
    return (
      <div
        className={cn(
          "flex",
          "items-center",
          "justify-center",
          "min-h-[60vh]",
          "w-full",
          "mt-20",
        )}
      >
        <LuLoader
          className={cn("w-8", "h-8", "text-primary", "animate-spin")}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className={cn(
        "max-w-[1600px]",
        "w-full",
        "mt-20",
        "p-5",
        "mx-auto",
        "space-y-8",
      )}
    >
      <AdminInvitesHeader
        activeCount={stats?.active ?? 0}
        onGenerateClick={() => setIsGenerateOpen(true)}
      />

      <AdminInvitesStats stats={stats} />

      <AdminInvitesToolbar
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
      />

      {invites.length === 0 && !loading ? (
        <AdminInvitesEmptyState
          isFiltered={!!(search || statusFilter)}
          onReset={() => {
            setSearch("");
            setStatusFilter("");
          }}
          onGenerate={() => setIsGenerateOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          <AdminInvitesTable
            invites={invites}
            onRevoke={handleRevoke}
            onMutation={handleMutation}
          />
          {pagination && pagination.totalPages > 1 && (
            <AdminInvitesPagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalInvites={pagination.total}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      <AdminGenerateInviteModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onSuccess={handleMutation}
      />
    </motion.div>
  );
}
