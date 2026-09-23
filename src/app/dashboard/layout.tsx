import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { TrialBanner } from '@/components/dashboard/TrialBanner'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s | Barbearia',
  },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.isExpired || user.status === 'SUSPENDED') {
    redirect('/trial-expirado')
  }

  return (
    <div className="min-h-screen bg-background">
      {user && (
        <TrialBanner
          status={user.status}
          trialEndsAt={user.trial_ends_at?.toISOString()}
          barberName={user.name}
        />
      )}
      <DashboardHeader
        user={
          user
            ? {
                name: user.name,
                salonName: user.organization?.name,
                email: user.email,
                isAdmin: user.isAdmin,
                status: user.status,
                trialEndsAt: user.trial_ends_at?.toISOString() || null,
                isExpired: user.isExpired,
              }
            : undefined
        }
      />
      <main className="pb-16 md:pb-0">{children}</main>
    </div>
  )
}

