"use client";

import { useSession } from "next-auth/react";

export default function AdminPage() {
    const { data: session, status } = useSession();

    if (session?.user.role !== "ADMIN") {
        return (
            <div>
                <h1>YOU are not admin...</h1>
            </div>
        );
    }
    return (
        <div>
            <h1>Welcome ADMIN!!</h1>
        </div>
    );
}
