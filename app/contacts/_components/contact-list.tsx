"use client"

import {
  createContactAction,
  deleteContactAction,
  updateContactAction
} from "@/actions/db/contacts-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectContact } from "@/db/schema"
import { PlusCircle, Trash2, Edit, User } from "lucide-react"
import { useState } from "react"

interface ContactListProps {
  userId: string
  initialContacts: SelectContact[]
}

export function ContactList({ userId, initialContacts }: ContactListProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [contacts, setContacts] = useState(initialContacts)
  const [editingId, setEditingId] = useState<string | null>(null)

  const resetForm = () => {
    setName("")
    setEmail("")
    setPhone("")
    setNotes("")
    setEditingId(null)
  }

  const handleAddContact = async () => {
    if (name.trim() !== "") {
      if (editingId) {
        // Update existing contact
        const result = await updateContactAction(editingId, {
          name,
          email,
          phone,
          notes
        })

        if (result.isSuccess) {
          setContacts(prevContacts =>
            prevContacts.map(contact =>
              contact.id === editingId ? result.data : contact
            )
          )
          resetForm()
        } else {
          console.error("Error updating contact:", result.message)
        }
      } else {
        // Add new contact
        const newContactData = {
          id: Date.now().toString(),
          userId,
          name,
          email,
          phone,
          notes,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        setContacts(prevContacts => [...prevContacts, newContactData])
        resetForm()

        const result = await createContactAction({
          userId: userId,
          name,
          email,
          phone,
          notes
        })

        if (result.isSuccess) {
          setContacts(prevContacts =>
            prevContacts.map(contact =>
              contact.id === newContactData.id ? result.data : contact
            )
          )
        } else {
          console.error("Error creating contact:", result.message)
          setContacts(prevContacts =>
            prevContacts.filter(contact => contact.id !== newContactData.id)
          )
        }
      }
    }
  }

  const handleEditContact = (contact: SelectContact) => {
    setName(contact.name)
    setEmail(contact.email || "")
    setPhone(contact.phone || "")
    setNotes(contact.notes || "")
    setEditingId(contact.id)
  }

  const handleRemoveContact = async (id: string) => {
    setContacts(prevContacts =>
      prevContacts.filter(contact => contact.id !== id)
    )
    await deleteContactAction(id)
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingId ? "Edit Contact" : "Add New Contact"}
            {editingId ? (
              <Edit className="size-5" />
            ) : (
              <PlusCircle className="size-5" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(123) 456-7890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Additional information"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
            <Button onClick={handleAddContact}>
              {editingId ? "Update" : "Add"} Contact
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Contacts</h2>

        {contacts.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
              <User className="text-muted-foreground size-10" />
              <p className="text-muted-foreground">
                No contacts yet. Add your first contact above.
              </p>
            </div>
          </Card>
        ) : (
          <div
            className={`grid gap-4 ${contacts.length === 1 ? "grid-cols-1" : "md:grid-cols-2"}`}
          >
            {contacts.map(contact => (
              <Card key={contact.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium">{contact.name}</h3>
                      {contact.email && (
                        <p className="text-muted-foreground text-sm">
                          {contact.email}
                        </p>
                      )}
                      {contact.phone && (
                        <p className="text-muted-foreground text-sm">
                          {contact.phone}
                        </p>
                      )}
                      {contact.notes && (
                        <p className="border-muted mt-2 border-l-2 pl-2 text-sm italic">
                          {contact.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditContact(contact)}
                      >
                        <Edit className="size-4" />
                        <span className="sr-only">Edit contact</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveContact(contact.id)}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete contact</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
