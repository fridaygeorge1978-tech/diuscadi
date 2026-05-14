"use client";
// app/admin/users/page.tsx

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { useAdminExport } from "@/hooks/useAdminExport";
import { AdminUsersHeader } from "@/components/sections/admin/users/AUHeader";
import { AdminUsersToolbar } from "@/components/sections/admin/users/AUToolbar";
import { AdminUsersTable } from "@/components/sections/admin/users/AUTable";
import { AdminUsersPagination } from "@/components/sections/admin/users/AUPagination";
import { AdminUsersEmptyState } from "@/components/sections/admin/users/AUEmptyState";
import { AdminUserDetailsModal } from "@/components/sections/admin/users/modal/AUDetailModal";
import { LuLoader } from "react-icons/lu";
import type { AdminUser } from "@/context/AdminContext";

const PAGE_SIZE = 10;

export default function UsersManagementPage() {
  const { token } = useAuth();
  const { users, usersPagination, loadingUsers, loadUsers } = useAdmin();

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Export — passes active filters so the CSV matches what admin is viewing
  const { exporting, triggerExport } = useAdminExport({
    route: "/api/admin/users",
    filenamePrefix: "diuscadi-users",
    loadingMessage: "Exporting users…",
    successMessage: "Users exported",
  });

  useEffect(() => {
    if (!token) return;
    loadUsers(
      {
        page: currentPage,
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
      },
      token,
    );
  }, [token, currentPage, search, role, status, loadUsers]);

  const handleMutation = () => {
    if (!token) return;
    loadUsers({ page: currentPage }, token);
  };

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setTimeout(() => setSelectedUser(null), 300);
  };

  if (loadingUsers && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full mt-20">
        <LuLoader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="space-y-6 w-full mt-20 p-6"
    >
      <AdminUsersHeader
        totalUsers={usersPagination?.total ?? users.length}
        onExport={() => triggerExport({ search, role, status })}
        exporting={exporting}
        onImport={() => console.warn("TODO: import CSV")}
      />

      <AdminUsersToolbar
        onSearchChange={setSearch}
        onRoleChange={setRole}
        onStatusChange={setStatus}
      />

      {users.length === 0 && !loadingUsers ? (
        <AdminUsersEmptyState
          isSearchActive={!!(search || role || status)}
          onClearFilters={() => {
            setSearch("");
            setRole("");
            setStatus("");
          }}
        />
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AdminUsersTable
            users={users}
            onViewDetails={handleViewUser}
            onMutation={handleMutation}
          />
          {usersPagination && usersPagination.totalPages > 1 && (
            <AdminUsersPagination
              currentPage={currentPage}
              totalPages={usersPagination.totalPages}
              totalUsers={usersPagination.total}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {selectedUser && (
        <AdminUserDetailsModal
          isOpen={isDetailsOpen}
          user={selectedUser}
          onClose={handleCloseDetails}
          onMutation={handleMutation}
        />
      )}
    </motion.div>
  );
}
