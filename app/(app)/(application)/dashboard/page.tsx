"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {

    const { data: session, status } = useSession();

    const router = useRouter();

    const [loading, setLoading] = useState<boolean>(false);

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen  flex">
                <h1>Loading....</h1>
            </div>
        )
    }

    if (status !== "authenticated") {
        return (
            <div className="min-h-screen  flex">
                <h1>You are not Authenticated</h1>
                <button
                    onClick={() => router.push('/login')}
                    className="p-5 bg-black text-white"
                    > SignIN </button>
            </div>
        )
    }

    return (
        <div>
            <ul>
                <li>UserId: {session.user.id}</li>
                <li>Name: {session.user.name}</li>
                <li>Email: {session.user.email}</li>
                <li>Role: {session.user.role}</li>
                <li>Member Since: {session.user.createdAt}</li>
            </ul>
        </div>
    )
}