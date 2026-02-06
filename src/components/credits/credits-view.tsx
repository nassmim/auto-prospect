"use client";

import { fetchAccountCredits } from "@/actions/credit.actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EContactChannel, type TContactChannel } from "@/config/message.config";
import {
  ETransactionType,
  type TransactionType,
} from "@/config/payment.config";
import { swrKeys } from "@/config/swr-keys";
import { SWR_POLLING } from "@/hooks/use-swr-action";
import { TCreditBalance, TTransactionMetadata } from "@/schema/credits.schema";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import useSWR from "swr";

type CreditData = {
  balance: TCreditBalance | undefined;
  huntAllocations: Array<{
    huntId: string;
    huntName: string;
    channel: TContactChannel;
    allocated: number;
    consumed: number;
    remaining: number;
  }>;
  transactions: Array<{
    id: string;
    type: TransactionType;
    channel: TContactChannel;
    amount: number;
    balanceAfter: number;
    createdAt: Date;
    metadata: TTransactionMetadata | null;
  }>;
};

type CreditsViewProps = {
  data: CreditData;
};

const channelLabels: Record<TContactChannel, string> = {
  [EContactChannel.SMS]: "SMS",
  [EContactChannel.RINGLESS_VOICE]: "Ringless Voice",
  [EContactChannel.WHATSAPP_TEXT]: "WhatsApp",
};

const transactionTypeLabels: Record<TransactionType, string> = {
  [ETransactionType.PURCHASE]: "Achat",
  [ETransactionType.USAGE]: "Utilisation",
  [ETransactionType.REFUND]: "Remboursement",
  [ETransactionType.ADJUSTMENT]: "Ajustement",
};

export function CreditsView({ data: initialData }: CreditsViewProps) {
  const [prevBalance, setPrevBalance] = useState<number | null>(null);
  const [balanceChanged, setBalanceChanged] = useState(false);

  // Fetch account credits with SWR polling
  const { data = initialData, isValidating } = useSWR(
    swrKeys.credits.balance,
    () => fetchAccountCredits(),
    {
      fallbackData: initialData,
      refreshInterval: SWR_POLLING.CREDITS,
      revalidateOnFocus: true,
      onSuccess: (newData) => {
        if (!newData.balance) return;

        const newTotal =
          newData.balance.sms +
          newData.balance.ringlessVoice +
          newData.balance.whatsappText;

        if (prevBalance !== null && newTotal !== prevBalance) {
          setBalanceChanged(true);
          setTimeout(() => setBalanceChanged(false), 2000);
        }
        setPrevBalance(newTotal);
      },
    },
  );

  // Guard against undefined balance
  if (!data.balance) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center text-zinc-400">
          <p>Aucune donnée de crédits disponible</p>
        </div>
      </div>
    );
  }

  const totalCredits =
    data.balance.sms + data.balance.ringlessVoice + data.balance.whatsappText;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Crédits</h1>
          <p className="text-zinc-400">
            Gérez vos crédits de contact pour SMS, WhatsApp et appels
          </p>
        </div>
        {isValidating && (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            Actualisation...
          </div>
        )}
      </div>

      {/* Credit Balance Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total crédits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold text-zinc-100 transition-all duration-500 ${
                balanceChanged ? "scale-110 text-amber-500" : ""
              }`}
            >
              {totalCredits.toLocaleString("fr-FR")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              SMS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">
              {data.balance.sms.toLocaleString("fr-FR")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Ringless Voice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">
              {data.balance.ringlessVoice.toLocaleString("fr-FR")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">
              {data.balance.whatsappText.toLocaleString("fr-FR")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hunt Allocations */}
      {data.huntAllocations.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-zinc-100">
              Allocation par recherche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                  <TableHead className="text-zinc-400">Recherche</TableHead>
                  <TableHead className="text-zinc-400">Canal</TableHead>
                  <TableHead className="text-right text-zinc-400">
                    Alloués
                  </TableHead>
                  <TableHead className="text-right text-zinc-400">
                    Consommés
                  </TableHead>
                  <TableHead className="text-right text-zinc-400">
                    Restants
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.huntAllocations.map((allocation) => (
                  <TableRow
                    key={`${allocation.huntId}-${allocation.channel}`}
                    className="border-zinc-800 hover:bg-zinc-900/50"
                  >
                    <TableCell className="font-medium text-zinc-100">
                      {allocation.huntName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-zinc-700">
                        {channelLabels[allocation.channel]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-zinc-300">
                      {allocation.allocated.toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right text-zinc-300">
                      {allocation.consumed.toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right text-zinc-100">
                      {allocation.remaining.toLocaleString("fr-FR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-zinc-100">
            Historique des transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.transactions.length === 0 ? (
            <div className="py-8 text-center text-zinc-500">
              Aucune transaction pour le moment
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                  <TableHead className="text-zinc-400">Date</TableHead>
                  <TableHead className="text-zinc-400">Type</TableHead>
                  <TableHead className="text-zinc-400">Canal</TableHead>
                  <TableHead className="text-right text-zinc-400">
                    Montant
                  </TableHead>
                  <TableHead className="text-right text-zinc-400">
                    Solde après
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className="border-zinc-800 hover:bg-zinc-900/50"
                  >
                    <TableCell className="text-zinc-300">
                      {formatDistanceToNow(new Date(transaction.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.type === ETransactionType.PURCHASE
                            ? "default"
                            : "outline"
                        }
                        className={
                          transaction.type === ETransactionType.PURCHASE
                            ? "bg-green-500/10 text-green-500"
                            : "border-zinc-700"
                        }
                      >
                        {transactionTypeLabels[transaction.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-zinc-700">
                        {channelLabels[transaction.channel]}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        transaction.amount > 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount.toLocaleString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right text-zinc-100">
                      {transaction.balanceAfter.toLocaleString("fr-FR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
