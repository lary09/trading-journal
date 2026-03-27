import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { getActiveStrategies } from "@/lib/data/strategies"
import { NewTradeForm } from "./new-trade-form"

export default async function NewTradePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const strategies = await getActiveStrategies(session.user.id)

  return <NewTradeForm strategies={strategies} />
}
