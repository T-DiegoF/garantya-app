"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useReadContract, usePublicClient } from "wagmi";
import { parseEther, formatEther, type Address, decodeEventLog } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FACTORY_ADDRESS, GARANTYA_FACTORY_ABI, GARANTYA_ABI } from "@/lib/contract";
import { snowtraceTxUrl, snowtraceUrl } from "@/lib/utils";
import { useT } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { PropertyMap } from "@/components/PropertyMap";

export default function HomePage() {
  const router  = useRouter();
  const { address, isConnected } = useAccount();
  const { t } = useT();

  const publicClient = usePublicClient();

  const [role,            setRole]            = useState<"landlord" | null>(null);
  const [landlord,        setLandlord]        = useState("");
  const [days,            setDays]            = useState("30");
  const [amount,          setAmount]          = useState("0.5");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [landlordName,    setLandlordName]    = useState("");
  const [tenantName,      setTenantName]      = useState("");
  const [errors,           setErrors]           = useState<Record<string, string>>({});
  const [txHash,           setTxHash]           = useState<string | null>(null);
  const [contractAddress,  setContractAddress]  = useState<string | null>(null);
  const [isSubmitting,     setIsSubmitting]     = useState(false);

  const { data: feeBps } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: GARANTYA_FACTORY_ABI,
    functionName: "feeBps",
  });
  const feeBpsBigInt = feeBps as bigint | undefined;

  const { writeContractAsync, isPending } = useWriteContract();

  const amountWei = (() => {
    try { return parseEther(amount); } catch { return 0n; }
  })();

  const fee     = feeBpsBigInt ? (amountWei * feeBpsBigInt) / 10000n : 0n;
  const deposit = amountWei - fee;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!landlord || !/^0x[a-fA-F0-9]{40}$/.test(landlord))
      e.landlord = t.home.errors.invalidAddress;
    if (landlord.toLowerCase() === address?.toLowerCase())
      e.landlord = t.home.errors.ownWallet;
    const d = Number.parseInt(days);
    if (Number.isNaN(d) || d < 1 || d > 1095)
      e.days = t.home.errors.days;
    const a = Number.parseFloat(amount);
    if (Number.isNaN(a) || a < 0.01 || a > 100)
      e.amount = t.home.errors.amount;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleDeploy() {
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const hash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: GARANTYA_FACTORY_ABI,
        functionName: "deployContract",
        args: [landlord as Address, amountWei, BigInt(days)],
      });
      setTxHash(hash);

      // Leer receipt para obtener la address del contrato nuevo
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      const createdLog = receipt.logs.find(log => {
        try {
          const decoded = decodeEventLog({ abi: GARANTYA_ABI, data: log.data, topics: log.topics });
          return decoded.eventName === "ContractCreated";
        } catch { return false; }
      });

      if (createdLog) {
        setContractAddress(createdLog.address);
        await supabase.from("contracts").insert({
          address:          createdLog.address,
          property_address: propertyAddress,
          landlord_name:    landlordName,
          tenant_name:      tenantName,
        });
      }

      setTimeout(() => {
        window.dispatchEvent(new Event("navigationstart"));
        router.push(`/mis-contratos`);
      }, 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setErrors({ submit: msg.includes("rejected") ? t.home.errors.rejected : t.home.errors.createFailed });
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Not connected ── */
  if (!isConnected) {
    return (
      <div className="py-6 space-y-10 animate-fade-up">
        {/* Hero */}
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5DFD5] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400"
            style={{ boxShadow: "0 1px 3px rgba(28,25,23,0.06)" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            {t.home.badge}
          </div>
          <h1 className="text-[52px] font-black tracking-[-0.03em] leading-[1.0]">
            {t.home.heroTitle.split("\n")[0]}<br />
            <em className="text-[#A07850] not-italic">{t.home.heroTitle.split("\n")[1]}</em>
          </h1>
          <p className="text-stone-400 text-base leading-relaxed max-w-sm">
            {t.home.heroSubtitle}
          </p>
        </div>

        {/* Role preview cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card space-y-3">
            <div className="w-9 h-9 rounded-xl bg-[#1C1917] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 8v6H2V8L8 2z" stroke="#F5F0E8" strokeWidth="1.5" strokeLinejoin="round" />
                <rect x="6" y="10" width="4" height="4" rx="0.5" fill="#F5F0E8" opacity="0.5" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">{t.home.landlordCard.tag}</p>
              <p className="text-sm text-stone-600 leading-relaxed mt-0.5">{t.home.landlordCard.desc}</p>
            </div>
          </div>
          <div className="card space-y-3">
            <div className="w-9 h-9 rounded-xl bg-[#A07850] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="6" cy="7" r="3.5" stroke="#F5F0E8" strokeWidth="1.5" />
                <path d="M9 7h5M12 5v4" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">{t.home.tenantCard.tag}</p>
              <p className="text-sm text-stone-600 leading-relaxed mt-0.5">{t.home.tenantCard.desc}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <ConnectButton label={t.home.connectButton} />
          <p className="text-xs text-stone-400">{t.home.noIntermediary}</p>
        </div>
      </div>
    );
  }

  /* ── Tx success ── */
  if (txHash) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 animate-fade-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1C1917]">
          <svg className="h-8 w-8 text-[#F5F0E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight">{t.home.contractCreated}</h2>
          <p className="text-stone-400 text-sm">{t.home.redirecting}</p>
        </div>
        <div className="card w-full space-y-3">
          <a
            href={snowtraceTxUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-xs font-mono text-stone-500 hover:text-[#A07850] transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Transacción</span>
            <span className="underline underline-offset-2">{txHash.slice(0, 10)}...{txHash.slice(-6)} →</span>
          </a>
          {contractAddress && (
            <a
              href={snowtraceUrl(contractAddress as Address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-xs font-mono text-stone-500 hover:text-[#A07850] transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Contrato</span>
              <span className="underline underline-offset-2">{contractAddress.slice(0, 10)}...{contractAddress.slice(-6)} →</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  /* ── Connected: role selector + form ── */
  return (
    <div className="space-y-5 animate-fade-up">

      {/* Role selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setRole("landlord")}
          className={[
            "card text-left space-y-3 transition-all duration-150",
            role === "landlord"
              ? "border-[#1C1917] ring-1 ring-[#1C1917]"
              : "hover:border-stone-300",
          ].join(" ")}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${role === "landlord" ? "bg-[#1C1917]" : "bg-stone-100"}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 8v6H2V8L8 2z" stroke={role === "landlord" ? "#F5F0E8" : "#1C1917"} strokeWidth="1.5" strokeLinejoin="round" />
              <rect x="6" y="10" width="4" height="4" rx="0.5" fill={role === "landlord" ? "#F5F0E8" : "#1C1917"} opacity="0.5" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">{t.home.landlordCard.tag}</p>
            <p className="text-sm text-stone-600 mt-0.5">{t.home.landlordRole}</p>
          </div>
        </button>

        <Link
          href="/mis-contratos"
          className="card space-y-3 hover:border-stone-300 transition-all duration-150"
        >
          <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6" cy="7" r="3.5" stroke="#1C1917" strokeWidth="1.5" />
              <path d="M9 7h5M12 5v4" stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">{t.home.tenantCard.tag}</p>
            <p className="text-sm text-stone-600 mt-0.5">{t.home.tenantRole}</p>
          </div>
        </Link>
      </div>

      {/* Create contract form */}
      {role === "landlord" && <>
        <div className="pt-2">
          <p className="screen-tag">{t.home.formTag}</p>
          <h1 className="text-3xl font-black tracking-tight leading-none">
            {t.home.formTitle}
          </h1>
          <p className="text-stone-400 text-sm mt-2 leading-relaxed">
            {t.home.formSubtitle}
          </p>
        </div>

        <div className="card space-y-5">
          <Input
            label={t.home.walletLabel}
            placeholder="0x..."
            value={landlord}
            onChange={e => setLandlord(e.target.value)}
            error={errors.landlord}
            mono
          />
          <div className="space-y-2">
            <Input
              label="Dirección del inmueble"
              placeholder="Av. Corrientes 1234, CABA"
              value={propertyAddress}
              onChange={e => setPropertyAddress(e.target.value)}
            />
            <PropertyMap address={propertyAddress} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tu nombre"
              placeholder="Nombre arrendador"
              value={landlordName}
              onChange={e => setLandlordName(e.target.value)}
            />
            <Input
              label="Nombre inquilino"
              placeholder="Nombre inquilino"
              value={tenantName}
              onChange={e => setTenantName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t.home.daysLabel}
              type="number"
              placeholder="30"
              value={days}
              onChange={e => setDays(e.target.value)}
              error={errors.days}
              min="1"
              max="1095"
            />
            <Input
              label={t.home.amountLabel}
              type="number"
              placeholder="0.5"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              error={errors.amount}
              step="0.01"
              min="0.01"
              max="100"
            />
          </div>

          <div className="divider" />

          {/* Fee breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-stone-400">{t.home.feeRow}</span>
              <span className="text-sm font-mono font-bold text-stone-500">{formatEther(fee).slice(0, 8)} AVAX</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-stone-500 font-medium">{t.home.depositRow}</span>
              <span className="text-base font-black text-[#A07850] tabular-nums">{formatEther(deposit).slice(0, 8)} AVAX</span>
            </div>
          </div>

          {errors.submit && (
            <p className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
              {errors.submit}
            </p>
          )}

          <Button fullWidth loading={isPending || isSubmitting} onClick={handleDeploy}>
            {t.home.createButton}
          </Button>
        </div>

        <p className="text-center text-[11px] text-stone-300 tracking-wide">
          {t.home.footer}
        </p>
      </>}
    </div>
  );
}
