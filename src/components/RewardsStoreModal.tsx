"use client";

import React, { useState } from "react";
import {
  Gift,
  Coins,
  Smartphone,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  Search,
  Filter,
  ShoppingBag,
  ShieldCheck,
  ArrowRight,
  Flame,
  Award,
} from "lucide-react";
import { PlayerState, RedeemedVoucher, RewardItem } from "@/types/naijaplay";
import { REWARDS_CATALOG } from "@/data/mockData";
import { sounds } from "@/lib/audio";

interface RewardsStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerState;
  onCoinsDeducted?: (newCoins: number) => void;
  onNavigateTab?: (tab: any) => void;
}

export const RewardsStoreModal: React.FC<RewardsStoreModalProps> = ({
  isOpen,
  onClose,
  player,
  onCoinsDeducted,
  onNavigateTab,
}) => {
  const [activeCategory, setActiveCategory] = useState<
    "ALL" | "AIRTIME_DATA" | "EXAM_VOUCHER" | "SCHOLARSHIP" | "MERCH"
  >("ALL");
  const [countryFilter, setCountryFilter] = useState<"ALL" | "NG" | "GH" | "KE" | "ZA">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"store" | "vault">("store");
  const [userCoins, setUserCoins] = useState(player.coins > 0 ? player.coins : 1850); // Default scholarship grant for testing
  const [myVouchers, setMyVouchers] = useState<RedeemedVoucher[]>([
    {
      id: "vouch-init-1",
      rewardId: "rew-airtime-mtn-1k",
      title: "MTN Nigeria ₦1,000 Airtime / Top-up",
      fiatValue: "₦1,000",
      voucherCode: "MTN-NPLAY-8921-4402-9182",
      redeemedAt: "2026-11-09T14:32:00Z",
      recipient: "0803-555-0192",
      status: "ACTIVE",
    },
  ]);

  // Redemption dialog state
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [recipientInput, setRecipientInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredRewards = REWARDS_CATALOG.filter((item) => {
    if (activeCategory !== "ALL" && item.category !== activeCategory) return false;
    if (countryFilter !== "ALL" && item.country !== countryFilter && item.country !== "PAN_AFRICA") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.provider.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStartRedemption = (item: RewardItem) => {
    sounds.playClick();
    setSelectedReward(item);
    setRecipientInput(player.displayName ? `${player.displayName.toLowerCase()}@scholar.naijaplay.ng` : "");
    setRedeemedCode(null);
    setErrorMessage(null);
    setCopiedCode(false);
  };

  const handleConfirmRedemption = () => {
    if (!selectedReward) return;
    if (!recipientInput.trim()) {
      setErrorMessage("Please enter recipient phone number or email address.");
      return;
    }

    if (userCoins < selectedReward.coinCost) {
      setErrorMessage(
        `Insufficient coins. You have ${userCoins} coins, but this reward requires ${selectedReward.coinCost} coins. Play games to earn more!`,
      );
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsProcessing(false);
      const newCoins = userCoins - selectedReward.coinCost;
      setUserCoins(newCoins);
      if (onCoinsDeducted) {
        onCoinsDeducted(newCoins);
      }

      sounds.playTrophy();
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const prefix = selectedReward.provider.toUpperCase().replace(/\s+/g, "");
      const generatedVoucherCode = `NP-${prefix}-${Date.now().toString().slice(-4)}-${randomSuffix}`;
      setRedeemedCode(generatedVoucherCode);

      const newVoucher: RedeemedVoucher = {
        id: `vouch-${Date.now()}`,
        rewardId: selectedReward.id,
        title: selectedReward.title,
        fiatValue: selectedReward.fiatValue,
        voucherCode: generatedVoucherCode,
        redeemedAt: new Date().toISOString(),
        recipient: recipientInput,
        status: "ACTIVE",
      };

      setMyVouchers((prev) => [newVoucher, ...prev]);
    }, 1200);
  };

  const handleCopyCode = (code: string) => {
    sounds.playClick();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col w-full max-w-4xl max-h-[92vh] rounded-2xl border border-slate-800 bg-[#0B111E] text-slate-100 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-lg shadow-amber-950/40">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                  Pan-African Rewards & Airtime Store
                </h2>
                <span className="rounded bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                  Live Phase 11
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Redeem airtime, WAEC/JAMB exam tokens, and STEM equipment with your earned gaming coins.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Coin Balance Pill */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-amber-500/40 px-3.5 py-1.5 shadow-inner">
              <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono leading-none">Your Balance</span>
                <span className="font-mono text-sm sm:text-base font-extrabold text-amber-300">
                  {userCoins.toLocaleString()} Coins
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Filters */}
        <div className="border-b border-slate-800 bg-slate-950/60 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab("store");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "store"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Rewards Catalog ({REWARDS_CATALOG.length})</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab("vault");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "vault"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>My Voucher Vault ({myVouchers.length})</span>
            </button>
          </div>

          {activeTab === "store" && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Country selector */}
              <div className="flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 p-1 text-[11px] font-mono">
                <button
                  onClick={() => setCountryFilter("ALL")}
                  className={`px-2 py-1 rounded font-semibold ${
                    countryFilter === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All Africa
                </button>
                <button
                  onClick={() => setCountryFilter("NG")}
                  className={`px-2 py-1 rounded font-semibold ${
                    countryFilter === "NG" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "text-slate-400 hover:text-white"
                  }`}
                >
                  🇳🇬 NG
                </button>
                <button
                  onClick={() => setCountryFilter("GH")}
                  className={`px-2 py-1 rounded font-semibold ${
                    countryFilter === "GH" ? "bg-amber-950 text-amber-300 border border-amber-800" : "text-slate-400 hover:text-white"
                  }`}
                >
                  🇬🇭 GH
                </button>
                <button
                  onClick={() => setCountryFilter("KE")}
                  className={`px-2 py-1 rounded font-semibold ${
                    countryFilter === "KE" ? "bg-red-950 text-red-300 border border-red-800" : "text-slate-400 hover:text-white"
                  }`}
                >
                  🇰🇪 KE
                </button>
                <button
                  onClick={() => setCountryFilter("ZA")}
                  className={`px-2 py-1 rounded font-semibold ${
                    countryFilter === "ZA" ? "bg-blue-950 text-blue-300 border border-blue-800" : "text-slate-400 hover:text-white"
                  }`}
                >
                  🇿🇦 ZA
                </button>
              </div>

              {/* Search box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search rewards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg bg-slate-900 border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-36 sm:w-44"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sub-Category Pills for Store */}
        {activeTab === "store" && (
          <div className="bg-slate-900/40 px-6 py-2.5 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-500 font-mono text-[11px] shrink-0">Filter By:</span>
            {[
              { id: "ALL", label: "All Products" },
              { id: "AIRTIME_DATA", label: "Airtime & 5G Data" },
              { id: "EXAM_VOUCHER", label: "WAEC, JAMB & NECO Vouchers" },
              { id: "SCHOLARSHIP", label: "Tech Scholarships" },
              { id: "MERCH", label: "Scholar Merch" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  sounds.playClick();
                  setActiveCategory(cat.id as any);
                }}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  activeCategory === cat.id
                    ? "bg-slate-800 text-emerald-400 border border-emerald-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "store" ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRewards.map((item) => {
                  const canAfford = userCoins >= item.coinCost;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition-all hover:border-slate-700 hover:shadow-xl group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="rounded-md bg-slate-950 border border-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-300">
                            {item.provider} · {item.country}
                          </span>
                          <span className="text-xs font-mono font-extrabold text-emerald-400">
                            {item.fiatValue}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-display text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                            {item.title}
                          </h4>
                          <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-300">
                          <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>{item.coinCost.toLocaleString()} Coins</span>
                        </div>

                        <button
                          onClick={() => handleStartRedemption(item)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
                            canAfford
                              ? "bg-emerald-600 text-white hover:bg-emerald-500"
                              : "bg-slate-800 text-slate-400 hover:text-slate-300"
                          }`}
                        >
                          {canAfford ? "Redeem" : "Locked"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredRewards.length === 0 && (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <p className="text-sm">No rewards match your current filter criteria.</p>
                  <button
                    onClick={() => {
                      setActiveCategory("ALL");
                      setCountryFilter("ALL");
                      setSearchQuery("");
                    }}
                    className="text-xs text-emerald-400 underline font-semibold"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Voucher Vault View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-white">
                  Active Vouchers & Recharge Tokens
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {myVouchers.length} Vouchers in Secure Storage
                </span>
              </div>

              <div className="space-y-3">
                {myVouchers.map((voucher) => (
                  <div
                    key={voucher.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-emerald-900/40 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 p-4 shadow-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                          VERIFIED TOKEN
                        </span>
                        <span className="text-xs font-semibold text-slate-300">
                          Recipient: {voucher.recipient}
                        </span>
                      </div>
                      <h4 className="font-display text-sm font-bold text-white">{voucher.title}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Redeemed: {new Date(voucher.redeemedAt).toLocaleDateString()} · Value: {voucher.fiatValue}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <div className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 font-mono text-xs font-extrabold text-amber-300 tracking-wider">
                        {voucher.voucherCode}
                      </div>
                      <button
                        onClick={() => handleCopyCode(voucher.voucherCode)}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm"
                        title="Copy code to clipboard"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedCode ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="border-t border-slate-800 bg-slate-900/80 px-6 py-3 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Automated instant dispatch via Paystack & Flutterwave Telco Webhooks.</span>
          </div>
          <div className="font-mono text-slate-500 text-[11px]">
            100% Academic Merit Funded · Zero Gambling Mechanics
          </div>
        </div>
      </div>

      {/* Redemption Confirmation Modal */}
      {selectedReward && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-display text-base font-bold text-white">
                {redeemedCode ? "Voucher Generated Successfully" : "Redeem Academic Reward"}
              </h3>
              <button
                onClick={() => setSelectedReward(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!redeemedCode ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 font-mono">Item</span>
                    <span className="text-xs font-bold text-emerald-400">{selectedReward.fiatValue}</span>
                  </div>
                  <h4 className="font-display text-sm font-bold text-white">{selectedReward.title}</h4>
                  <p className="text-xs text-slate-400">{selectedReward.description}</p>
                  <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs font-mono">
                    <span className="text-slate-400">Cost:</span>
                    <span className="font-bold text-amber-300">{selectedReward.coinCost} Coins</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Recipient Phone Number or Email:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 08031234567 or scholar@gmail.com"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Recharge string or examination voucher instructions will be delivered to this destination.
                  </span>
                </div>

                {errorMessage && (
                  <p className="rounded-xl bg-red-950/50 border border-red-900/80 p-3 text-xs text-red-300">
                    {errorMessage}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setSelectedReward(null)}
                    className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRedemption}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span>Verifying Gateway...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm ({selectedReward.coinCost} Coins)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Success Voucher Generated State */
              <div className="space-y-5 text-center py-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div>
                  <h4 className="font-display text-lg font-bold text-white">Your Voucher Code Is Ready!</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Your code has also been archived to your personal Voucher Vault.
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-900/60 bg-slate-950 p-4 space-y-3">
                  <span className="text-[11px] text-slate-400 font-mono block">Official Voucher Code:</span>
                  <div className="font-mono text-base font-extrabold text-amber-300 tracking-widest bg-slate-900 py-2.5 px-3 rounded-lg border border-slate-800 select-all">
                    {redeemedCode}
                  </div>
                  <button
                    onClick={() => handleCopyCode(redeemedCode)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedCode ? "Copied to Clipboard!" : "Copy Voucher String"}</span>
                  </button>
                </div>

                <div className="text-left text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="font-bold text-white block">How to apply:</span>
                  <p className="text-[11px] text-slate-400">
                    {selectedReward.category === "AIRTIME_DATA"
                      ? "Dial your provider's recharge USSD string (e.g. *311*PIN#) or use your bank telecom portal."
                      : selectedReward.category === "EXAM_VOUCHER"
                      ? "Paste this voucher string into the official candidate registration portal (waecdirect.org or jamb.gov.ng)."
                      : "Present this voucher code to your academic coordinator or email scholarships@naijaplay.ng."}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedReward(null);
                    setActiveTab("vault");
                  }}
                  className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-700"
                >
                  View My Vault
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
