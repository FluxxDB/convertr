"use client"

import type React from "react"

import { X, Moon, Sun, ChevronRight, ChevronLeft, Plus, Trash2, MoreVertical, Pencil } from "lucide-react"
import { useTheme } from "./theme-provider"
import { useState, useEffect } from "react"

type SettingsModalProps = {
  isOpen: boolean
  onClose: () => void
}

type EmergencyContact = {
  id: string
  name: string
  phone: string
}

type SettingsPage = "main" | "emergency-contacts" | "communication-settings"

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, toggleTheme } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const [currentPage, setCurrentPage] = useState<SettingsPage>("main")
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])

  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null)
  const [contactFormData, setContactFormData] = useState({ name: "", phone: "" })

  const [emergencyMessage, setEmergencyMessage] = useState(
    "I need help. This is an emergency. Please contact me immediately or send assistance to my location.",
  )
  const [appendLocation, setAppendLocation] = useState(true)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [tempMessage, setTempMessage] = useState("")

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      setCurrentPage("main") // Reset to main page when opening
    }
  }, [isOpen])

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const deltaY = e.touches[0].clientY - startY
    if (deltaY > 0) {
      setCurrentY(deltaY)
    }
  }

  const handleTouchEnd = () => {
    if (currentY > 100) {
      handleClose()
    }
    setCurrentY(0)
    setIsDragging(false)
  }

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const handleToggle = () => {
    toggleTheme()
  }

  const addEmergencyContact = () => {
    if (emergencyContacts.length < 3) {
      setEditingContact(null)
      setContactFormData({ name: "", phone: "" })
      setIsContactModalOpen(true)
    }
  }

  const editEmergencyContact = (contact: EmergencyContact) => {
    setEditingContact(contact)
    setContactFormData({ name: contact.name, phone: contact.phone })
    setIsContactModalOpen(true)
  }

  const saveContact = () => {
    if (editingContact) {
      // Update existing contact
      setEmergencyContacts(
        emergencyContacts.map((contact) =>
          contact.id === editingContact.id
            ? { ...contact, name: contactFormData.name, phone: contactFormData.phone }
            : contact,
        ),
      )
    } else {
      // Add new contact
      setEmergencyContacts([
        ...emergencyContacts,
        { id: Date.now().toString(), name: contactFormData.name, phone: contactFormData.phone },
      ])
    }
    setIsContactModalOpen(false)
    setContactFormData({ name: "", phone: "" })
  }

  const removeEmergencyContact = (id: string) => {
    setEmergencyContacts(emergencyContacts.filter((contact) => contact.id !== id))
    setIsContactModalOpen(false)
  }

  const openMessageModal = () => {
    setTempMessage(emergencyMessage)
    setIsMessageModalOpen(true)
  }

  const saveMessage = () => {
    setEmergencyMessage(tempMessage)
    setIsMessageModalOpen(false)
  }

  const getTruncatedMessage = (message: string, maxLines = 3) => {
    const lines = message.split("\n")
    if (lines.length > maxLines) {
      return lines.slice(0, maxLines).join("\n") + "..."
    }
    return message
  }

  const getPageTitle = () => {
    switch (currentPage) {
      case "emergency-contacts":
        return "Emergency Contacts"
      case "communication-settings":
        return "Communication Settings"
      default:
        return "Settings"
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/70 z-[60] transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed inset-x-0 bottom-0 z-[70] max-w-[430px] mx-auto transition-transform duration-300 ${
          isAnimating ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ transform: isDragging ? `translateY(${currentY}px)` : undefined }}
      >
        <div className="bg-background rounded-t-3xl shadow-2xl">
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              {currentPage !== "main" && (
                <button
                  onClick={() => setCurrentPage("main")}
                  className="p-2 hover:bg-surface-hover rounded-full transition-colors -ml-2"
                >
                  <ChevronLeft className="w-5 h-5 text-text-primary" />
                </button>
              )}
              <h2 className="text-xl font-semibold text-text-primary">{getPageTitle()}</h2>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-surface-hover rounded-full transition-colors">
              <X className="w-5 h-5 text-text-primary" />
            </button>
          </div>

          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {currentPage === "main" && (
              <>
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-text-secondary mb-3">Appearance</h3>

                  <div className="flex items-center justify-between bg-surface rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      {theme === "dark" ? (
                        <Moon className="w-5 h-5 text-text-primary" />
                      ) : (
                        <Sun className="w-5 h-5 text-text-primary" />
                      )}
                      <div>
                        <div className="text-text-primary font-medium">Theme</div>
                        <div className="text-text-secondary text-sm">
                          {theme === "dark" ? "Dark mode" : "Light mode"}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleToggle}
                      className={`relative w-12 h-7 rounded-full transition-colors ${
                        theme === "dark" ? "bg-accent" : "bg-border"
                      }`}
                      aria-label="Toggle theme"
                    >
                      <div
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          theme === "dark" ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-text-secondary mb-3">Privacy & Security</h3>

                  <button
                    onClick={() => setCurrentPage("emergency-contacts")}
                    className="w-full flex items-center justify-between bg-surface hover:bg-surface-hover rounded-xl px-4 py-3 transition-colors mb-2"
                  >
                    <span className="text-text-primary">Emergency Contacts</span>
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary text-sm">{emergencyContacts.length} contacts</span>
                      <ChevronRight className="w-4 h-4 text-text-secondary" />
                    </div>
                  </button>

                  <button
                    onClick={() => setCurrentPage("communication-settings")}
                    className="w-full flex items-center justify-between bg-surface hover:bg-surface-hover rounded-xl px-4 py-3 transition-colors"
                  >
                    <span className="text-text-primary">Communication Settings</span>
                    <ChevronRight className="w-4 h-4 text-text-secondary" />
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-3">About</h3>

                  <button className="w-full flex items-center justify-between bg-surface hover:bg-surface-hover rounded-xl px-4 py-3 mb-2 transition-colors">
                    <span className="text-text-primary">Version</span>
                    <span className="text-text-secondary text-sm font-mono">v1.0.0</span>
                  </button>

                  <button className="w-full flex items-center justify-between bg-surface hover:bg-surface-hover rounded-xl px-4 py-3 transition-colors">
                    <span className="text-text-primary">Help & Support</span>
                  </button>
                </div>
              </>
            )}

            {currentPage === "emergency-contacts" && (
              <div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
                  <p className="text-amber-600 dark:text-amber-400 text-sm">
                    Only +1 (US/Canada) phone numbers are currently supported
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  {emergencyContacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      className="bg-surface hover:bg-surface-hover rounded-xl px-4 py-3 flex items-center justify-between transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-text-primary font-medium truncate">
                          {contact.name || "Unnamed Contact"}
                        </div>
                        <div className="text-text-secondary text-sm font-mono">+1 {contact.phone || "No number"}</div>
                      </div>
                      <button
                        onClick={() => editEmergencyContact(contact)}
                        className="p-2 hover:bg-background rounded-lg transition-colors ml-2"
                      >
                        <MoreVertical className="w-5 h-5 text-text-secondary" />
                      </button>
                    </div>
                  ))}
                </div>

                {emergencyContacts.length < 3 && (
                  <button
                    onClick={addEmergencyContact}
                    className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white rounded-xl px-4 py-3 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Add Emergency Contact
                  </button>
                )}

                {emergencyContacts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-text-secondary text-sm">No emergency contacts added yet</p>
                  </div>
                )}
              </div>
            )}

            {currentPage === "communication-settings" && (
              <div className="space-y-6">
                <div>
                  <label className="text-text-secondary text-sm mb-2 block">Emergency Message</label>
                  <button
                    onClick={openMessageModal}
                    className="relative w-full bg-surface hover:bg-surface-hover border border-border rounded-xl px-4 py-3 text-left transition-colors"
                  >
                    <p className="text-text-primary text-sm leading-relaxed line-clamp-3 pr-8">
                      {getTruncatedMessage(emergencyMessage)}
                    </p>
                    <div className="absolute bottom-3 right-3">
                      <Pencil className="w-4 h-4 text-text-secondary" />
                    </div>
                  </button>
                </div>

                <div className="bg-surface rounded-xl px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-text-primary font-medium mb-1">Append Current Location</div>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        When SOS is dialed, the Agent will report the User's current location to the dispatcher or
                        emergency contact automatically.
                      </p>
                    </div>
                    <button
                      onClick={() => setAppendLocation(!appendLocation)}
                      className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
                        appendLocation ? "bg-accent" : "bg-border"
                      }`}
                      aria-label="Toggle append location"
                    >
                      <div
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                          appendLocation ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isContactModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/80 z-[80] transition-opacity"
            onClick={() => setIsContactModalOpen(false)}
          />
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 max-w-[430px] mx-auto">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">
                  {editingContact ? "Edit Contact" : "Add Contact"}
                </h3>
                <button
                  onClick={() => setIsContactModalOpen(false)}
                  className="p-2 hover:bg-surface-hover rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-text-primary" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="text-text-secondary text-sm mb-2 block">Name</label>
                  <input
                    type="text"
                    value={contactFormData.name}
                    onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                    placeholder="Enter name"
                    className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="text-text-secondary text-sm mb-2 block">Phone Number</label>
                  <div className="flex gap-2">
                    <div className="bg-surface border border-border rounded-lg px-4 py-3 text-text-primary font-mono flex items-center">
                      +1
                    </div>
                    <input
                      type="tel"
                      value={contactFormData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10)
                        setContactFormData({ ...contactFormData, phone: value })
                      }}
                      placeholder="(555) 123-4567"
                      className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border flex gap-3">
                {editingContact && (
                  <button
                    onClick={() => removeEmergencyContact(editingContact.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl px-4 py-3 transition-colors font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
                <button
                  onClick={saveContact}
                  disabled={!contactFormData.name || !contactFormData.phone}
                  className="flex-1 bg-accent hover:bg-accent/90 text-white rounded-xl px-4 py-3 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {isMessageModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/80 z-[80] transition-opacity"
            onClick={() => setIsMessageModalOpen(false)}
          />
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 max-w-[430px] mx-auto">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary">Edit Emergency Message</h3>
                <button
                  onClick={() => setIsMessageModalOpen(false)}
                  className="p-2 hover:bg-surface-hover rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-text-primary" />
                </button>
              </div>

              <div className="px-6 py-4">
                <textarea
                  value={tempMessage}
                  onChange={(e) => setTempMessage(e.target.value)}
                  placeholder="Enter your emergency message..."
                  rows={8}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              <div className="px-6 py-4 border-t border-border">
                <button
                  onClick={saveMessage}
                  disabled={!tempMessage.trim()}
                  className="w-full bg-accent hover:bg-accent/90 text-white rounded-xl px-4 py-3 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Message
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
