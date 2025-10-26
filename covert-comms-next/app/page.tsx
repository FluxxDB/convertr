"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Menu,
  Plus,
  Search,
  Settings,
  AlertTriangle,
  Home,
  MoreHorizontal,
  ChevronRight,
  MessageSquare,
  BookOpen,
  MicIcon,
  Wifi,
  Radio,
  Users,
  ArrowLeft,
  Play,
  Trash2,
} from "lucide-react"
import { SettingsModal } from "@/components/settings-modal"

type Page = "home" | "voice-memo" | "walking-home"

export default function CovertCommsApp() {
  const [currentPage, setCurrentPage] = useState<Page>("home")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [sosHolding, setSosHolding] = useState(false)
  const [sosTimer, setSosTimer] = useState(0)
  const [sosAlertOpen, setSosAlertOpen] = useState(false)
  const [voiceMemoHolding, setVoiceMemoHolding] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const sosTimerRef = useRef<NodeJS.Timeout | null>(null)
  const voiceMemoTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [connectivityStatus, setConnectivityStatus] = useState<"peer" | "wifi" | "cellular">("wifi")

  // Mock past memos
  const [pastMemos] = useState([
    { id: 1, title: "Memo 1", duration: "0:45", date: "Today, 2:30 PM" },
    { id: 2, title: "Memo 2", duration: "1:20", date: "Yesterday, 5:15 PM" },
    { id: 3, title: "Memo 3", duration: "0:32", date: "Jan 15, 3:45 PM" },
  ])

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchEnd - touchStart
    const isLeftSwipe = distance < -minSwipeDistance
    const isRightSwipe = distance > minSwipeDistance

    if (isRightSwipe && touchStart < 50 && !sidebarOpen) {
      setSidebarOpen(true)
    }
    if (isLeftSwipe && sidebarOpen) {
      setSidebarOpen(false)
    }
  }

  const handleSosPress = () => {
    setSosHolding(true)
    setSosTimer(0)
    sosTimerRef.current = setInterval(() => {
      setSosTimer((prev) => {
        if (prev >= 3) {
          handleSosRelease()
          setSosAlertOpen(true)
          return 0
        }
        return prev + 0.1
      })
    }, 100)
  }

  const handleSosRelease = () => {
    setSosHolding(false)
    setSosTimer(0)
    if (sosTimerRef.current) {
      clearInterval(sosTimerRef.current)
      sosTimerRef.current = null
    }
  }

  const handleVoiceMemoPress = () => {
    setVoiceMemoHolding(true)
    voiceMemoTimerRef.current = setTimeout(() => {
      console.log("[v0] Quick voice memo recording started")
    }, 500)
  }

  const handleVoiceMemoRelease = () => {
    setVoiceMemoHolding(false)
    if (voiceMemoTimerRef.current) {
      clearTimeout(voiceMemoTimerRef.current)
      voiceMemoTimerRef.current = null
    }
  }

  const handleVoiceMemoClick = () => {
    setCurrentPage("voice-memo")
  }

  const handleWalkingHomeClick = () => {
    setCurrentPage("walking-home")
  }

  useEffect(() => {
    return () => {
      if (sosTimerRef.current) clearInterval(sosTimerRef.current)
      if (voiceMemoTimerRef.current) clearTimeout(voiceMemoTimerRef.current)
    }
  }, [])

  const getConnectivityInfo = () => {
    switch (connectivityStatus) {
      case "peer":
        return { icon: Users, text: "Connected to Peer" }
      case "wifi":
        return { icon: Wifi, text: "Connected via Wi-Fi" }
      case "cellular":
        return { icon: Radio, text: "Connected via Cellular" }
    }
  }

  const ConnectivityIcon = getConnectivityInfo().icon

  const VoiceMemoPage = () => (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 px-4 py-3 border-b border-border">
        <button
          onClick={() => setCurrentPage("home")}
          className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-text-primary" />
        </button>
        <h1 className="text-lg font-medium text-text-primary">Voice Memos</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        {/* Recording Section */}
        <div className="mb-8">
          <div className="bg-surface rounded-2xl p-8 flex flex-col items-center gap-6 border border-border">
            {/* Audio Visualizer */}
            <div className="flex items-center justify-center gap-1 h-24 w-full">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    isRecording ? "bg-danger animate-pulse" : "bg-text-secondary/30"
                  }`}
                  style={{
                    height: isRecording ? `${Math.random() * 60 + 20}px` : "20px",
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>

            {/* Record Button */}
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording ? "bg-danger hover:bg-danger/90 scale-110" : "bg-accent hover:bg-accent/90"
              }`}
            >
              <MicIcon className="w-10 h-10 text-white" />
            </button>

            <span className="text-text-primary font-mono text-lg">
              {isRecording ? "Recording..." : "Tap to Record"}
            </span>
          </div>
        </div>

        {/* Past Memos */}
        <div>
          <h2 className="text-text-primary font-semibold mb-4">Past Memos</h2>
          <div className="space-y-3">
            {pastMemos.map((memo) => (
              <div
                key={memo.id}
                className="bg-surface hover:bg-surface-hover rounded-xl p-4 flex items-center gap-4 border border-border transition-colors"
              >
                <button className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </button>
                <div className="flex-1">
                  <h3 className="text-text-primary font-medium">{memo.title}</h3>
                  <p className="text-text-secondary text-sm">
                    {memo.duration} • {memo.date}
                  </p>
                </div>
                <button className="p-2 hover:bg-background rounded-lg transition-colors">
                  <Trash2 className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const WalkingHomePage = () => (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 px-4 py-3 border-b border-border">
        <button
          onClick={() => setCurrentPage("home")}
          className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-text-primary" />
        </button>
        <h1 className="text-lg font-medium text-text-primary">Walking Home</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* SOS Button */}
        <div className="mb-12">
          <button
            onMouseDown={handleSosPress}
            onMouseUp={handleSosRelease}
            onMouseLeave={handleSosRelease}
            onTouchStart={(e) => {
              e.preventDefault()
              handleSosPress()
            }}
            onTouchEnd={handleSosRelease}
            className={`w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl ${
              sosHolding ? "bg-danger scale-95" : "bg-danger/90 hover:bg-danger"
            }`}
          >
            <AlertTriangle className="w-20 h-20 text-white mb-2" />
            <span className="text-white text-xl font-bold">{sosHolding ? `${Math.ceil(3 - sosTimer)}s` : "SOS"}</span>
            {sosHolding && (
              <div className="absolute bottom-8 w-32 bg-white/30 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-100"
                  style={{ width: `${(sosTimer / 3) * 100}%` }}
                />
              </div>
            )}
          </button>
        </div>

        {/* Warning Message */}
        <div className="bg-warning/10 border border-warning rounded-2xl p-6 max-w-md">
          <div className="flex gap-3">
            <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-text-primary font-semibold mb-2">Safety Check-In Active</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                The app will send you a discreet notification every 5 minutes to confirm your presence. If you don't
                respond within 1 minute, Emergency SOS will be automatically triggered and your emergency contacts will
                be notified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (currentPage === "voice-memo") {
    return (
      <div className="relative h-screen w-full max-w-[430px] mx-auto bg-background overflow-hidden">
        <VoiceMemoPage />
      </div>
    )
  }

  if (currentPage === "walking-home") {
    return (
      <div className="relative h-screen w-full max-w-[430px] mx-auto bg-background overflow-hidden">
        <WalkingHomePage />
      </div>
    )
  }

  return (
    <div
      className="relative h-screen w-full max-w-[430px] mx-auto bg-background overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <div
        className={`absolute top-0 left-0 h-full w-[85%] bg-background z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-surface text-text-primary pl-11 pr-4 py-3 rounded-full border border-border focus:outline-none focus:border-accent"
            />
          </div>

          {/* New Chat Button */}
          <button className="flex items-center gap-3 w-full bg-surface hover:bg-surface-hover text-text-primary px-4 py-3 rounded-xl mb-6 transition-colors">
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Conversation</span>
          </button>

          {/* Quick Actions Section */}
          <div className="mb-6 pb-6 border-b border-border">
            <h3 className="text-text-secondary text-sm font-medium mb-3 px-2">Quick Actions</h3>

            {/* Walking Home */}
            <button className="flex items-center gap-3 w-full hover:bg-surface-hover text-text-primary px-4 py-3 rounded-xl mb-2 transition-colors">
              <Home className="w-5 h-5 text-warning" />
              <span>Walking Home?</span>
            </button>

            {/* SOS Button */}
            <button
              onMouseDown={handleSosPress}
              onMouseUp={handleSosRelease}
              onMouseLeave={handleSosRelease}
              onTouchStart={(e) => {
                e.preventDefault()
                handleSosPress()
              }}
              onTouchEnd={handleSosRelease}
              className={`flex items-center gap-3 w-full text-text-primary px-4 py-3 rounded-xl transition-all ${
                sosHolding ? "bg-danger scale-95" : "hover:bg-surface-hover"
              }`}
            >
              <AlertTriangle className={`w-5 h-5 ${sosHolding ? "text-white" : "text-danger"}`} />
              <span className={sosHolding ? "text-white font-semibold" : ""}>
                SOS {sosHolding ? "(Sending...)" : "(Press & Hold)"}
              </span>
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-text-secondary text-sm font-medium mb-3 px-2">Recent</h3>

            <button className="flex items-center gap-3 w-full hover:bg-surface-hover text-text-primary px-4 py-3 rounded-xl mb-1 transition-colors">
              <MessageSquare className="w-5 h-5" />
              <span className="flex-1 text-left truncate">Conversation 1</span>
            </button>

            <button className="flex items-center gap-3 w-full hover:bg-surface-hover text-text-primary px-4 py-3 rounded-xl mb-1 transition-colors">
              <MessageSquare className="w-5 h-5" />
              <span className="flex-1 text-left truncate">Conversation 2</span>
            </button>

            <button className="flex items-center gap-3 w-full hover:bg-surface-hover text-text-primary px-4 py-3 rounded-xl mb-1 transition-colors">
              <MessageSquare className="w-5 h-5" />
              <span className="flex-1 text-left truncate">Conversation 3</span>
            </button>

            <button className="flex items-center gap-3 w-full hover:bg-surface-hover text-text-secondary px-4 py-3 rounded-xl transition-colors">
              <MoreHorizontal className="w-5 h-5" />
              <span>See more</span>
            </button>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 w-full hover:bg-surface-hover text-text-primary px-4 py-3 rounded-xl mt-4 transition-colors border-t border-border pt-4"
          >
            <Settings className="w-5 h-5" />
            <span className="flex-1 text-left">Settings</span>
            <ChevronRight className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
      </div>

      <div className={`h-full transition-all duration-300 ${sidebarOpen ? "translate-x-[85%]" : "translate-x-0"}`}>
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 pointer-events-none ${
            sidebarOpen ? "opacity-40" : "opacity-0"
          }`}
        />

        {sidebarOpen && <div className="absolute inset-0 z-30" onClick={() => setSidebarOpen(false)} />}

        {/* Main Chat Interface */}
        <div className="relative flex flex-col h-full z-20">
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-border">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-text-primary" />
            </button>

            <h1 className="text-lg font-medium text-text-primary">
              Covert <span className="text-text-secondary font-mono text-sm">v1</span>
            </h1>

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            >
              <Settings className="w-6 h-6 text-text-primary" />
            </button>
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto px-6 py-8 pb-24">
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                onClick={() => console.log("[v0] Navigate to Notepad")}
                className="col-span-2 bg-surface hover:bg-surface-hover rounded-2xl p-6 transition-all active:scale-95 flex flex-col items-start justify-end gap-3 min-h-[160px] border-2 border-green-500"
              >
                <BookOpen className="w-12 h-12 text-green-500" />
                <span className="text-text-primary text-xl font-semibold">Notepad</span>
              </button>

              <button
                onClick={handleVoiceMemoClick}
                onMouseDown={handleVoiceMemoPress}
                onMouseUp={handleVoiceMemoRelease}
                onMouseLeave={handleVoiceMemoRelease}
                onTouchStart={(e) => {
                  e.preventDefault()
                  handleVoiceMemoPress()
                }}
                onTouchEnd={handleVoiceMemoRelease}
                className={`bg-surface hover:bg-surface-hover rounded-2xl p-6 transition-all active:scale-95 flex flex-col items-start justify-end gap-2 min-h-[140px] border border-border ${
                  voiceMemoHolding ? "bg-accent border-accent" : ""
                }`}
              >
                <MicIcon className={`w-10 h-10 ${voiceMemoHolding ? "text-white" : "text-text-primary"}`} />
                <div className="flex flex-col items-start">
                  <span className={`text-sm font-medium ${voiceMemoHolding ? "text-white" : "text-text-primary"}`}>
                    {voiceMemoHolding ? "Recording..." : "Voice Memo"}
                  </span>
                  {!voiceMemoHolding && <span className="text-xs text-text-secondary">Tap or hold</span>}
                </div>
              </button>

              <button
                onClick={handleWalkingHomeClick}
                className="bg-surface hover:bg-surface-hover rounded-2xl p-6 transition-all active:scale-95 flex flex-col items-start justify-end gap-2 min-h-[140px] border border-border"
              >
                <Home className="w-10 h-10 text-warning" />
                <span className="text-sm font-medium text-text-primary">Walking Home?</span>
              </button>

              <button
                onMouseDown={handleSosPress}
                onMouseUp={handleSosRelease}
                onMouseLeave={handleSosRelease}
                onTouchStart={(e) => {
                  e.preventDefault()
                  handleSosPress()
                }}
                onTouchEnd={handleSosRelease}
                className={`col-span-2 rounded-2xl p-6 transition-all active:scale-95 flex flex-col items-start justify-end gap-3 min-h-[160px] border-2 ${
                  sosHolding ? "bg-danger border-danger" : "bg-surface hover:bg-surface-hover border-danger"
                }`}
              >
                <AlertTriangle className={`w-10 h-10 ${sosHolding ? "text-white" : "text-danger"}`} />
                <div className="flex flex-col items-start gap-2 w-full">
                  <span className={`text-lg font-semibold ${sosHolding ? "text-white" : "text-danger"}`}>
                    {sosHolding ? `Sending SOS... ${Math.ceil(3 - sosTimer)}s` : "Emergency SOS"}
                  </span>
                  {!sosHolding && <span className="text-xs text-text-secondary">Hold for 3 seconds</span>}
                  {sosHolding && (
                    <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-white h-full transition-all duration-100"
                        style={{ width: `${(sosTimer / 3) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
            <div className="bg-surface/95 backdrop-blur-sm border border-border rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
              <ConnectivityIcon className="w-4 h-4 text-accent" />
              <span className="text-sm text-text-primary font-medium">{getConnectivityInfo().text}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {sosAlertOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSosAlertOpen(false)} />
          <div className="relative bg-background rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-border">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-danger rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-text-primary text-center">
                Alerting Emergency Services and Contacts
              </h2>
              <p className="text-text-secondary text-center text-sm">
                Your emergency contacts and local services are being notified of your situation.
              </p>
              <button
                onClick={() => setSosAlertOpen(false)}
                className="mt-4 w-full bg-surface hover:bg-surface-hover text-text-primary py-3 rounded-xl font-medium transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
