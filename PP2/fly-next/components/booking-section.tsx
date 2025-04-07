"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { X, CreditCard, Trash, Plus, Minus, BookOpen, Plane } from "lucide-react"
import Image from "next/image"
import { useBookings } from "@/app/bookingsContext"
import jsPDF from "jspdf"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface CheckoutComponentProps {
  onClose: () => void
}

export default function CheckoutComponent({ onClose }: CheckoutComponentProps) {
  const { bookings, removeBooking, updateQuantity, clearBookings, addToItinerary } = useBookings()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [invoiceBookings, setInvoiceBookings] = useState<typeof bookings>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Format card number with spaces
    if (name === "cardNumber") {
      const formatted = value
        .replace(/\s/g, "")
        .replace(/(.{4})/g, "$1 ")
        .trim()
      setFormData({ ...formData, [name]: formatted })
    }
    // Format expiry date with slash
    else if (name === "expiry") {
      const cleaned = value.replace(/\D/g, "")
      let formatted = cleaned
      if (cleaned.length > 2) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
      }
      setFormData({ ...formData, [name]: formatted })
    } else {
      setFormData({ ...formData, [name]: value })
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.cardNumber.trim() || formData.cardNumber.replace(/\s/g, "").length !== 16) {
      newErrors.cardNumber = "Please enter a valid 16-digit card number"
    }

    if (!formData.cardName.trim()) {
      newErrors.cardName = "Please enter the name on card"
    }

    if (!formData.expiry.trim() || !formData.expiry.includes("/") || formData.expiry.length !== 5) {
      newErrors.expiry = "Please enter a valid expiry date (MM/YY)"
    }

    if (!formData.cvv.trim() || formData.cvv.length < 3) {
      newErrors.cvv = "Please enter a valid CVV"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);

      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);

        // Preserve bookings for invoice generation
        setInvoiceBookings(bookings);

        // Move bookings to itinerary as a new group
        addToItinerary(bookings);

        // Show confirmation modal
        setShowConfirmation(true);

        // Clear bookings after payment
        clearBookings();
      }, 1500);
    }
  };

  const generateInvoice = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text("Booking Invoice", 10, 10);

    // Add date
    const date = new Date().toLocaleString();
    doc.setFontSize(10);
    doc.text(`Date: ${date}`, 10, 20);

    // Add booking details
    doc.setFontSize(12);
    doc.text("Booking Details:", 10, 30);

    let yOffset = 40; // Vertical offset for the content
    invoiceBookings.forEach((booking, index) => {
      doc.text(`${index + 1}. ${booking.title}`, 10, yOffset);
      doc.text(`   Details: ${booking.details}`, 10, yOffset + 10);
      doc.text(`   Quantity: ${booking.quantity}`, 10, yOffset + 20);
      doc.text(`   Price: $${booking.price.toFixed(2)}`, 10, yOffset + 30);
      doc.text(`   Total: $${(booking.price * booking.quantity).toFixed(2)}`, 10, yOffset + 40);
      yOffset += 50; // Add space for the next booking
    });

    // Add total cost
    const subtotal = invoiceBookings.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.15; // 15% tax
    const total = subtotal + tax;

    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 10, yOffset);
    doc.text(`Tax (15%): $${tax.toFixed(2)}`, 10, yOffset + 10);
    doc.text(`Total: $${total.toFixed(2)}`, 10, yOffset + 20);

    // Save the PDF
    doc.save("booking-invoice.pdf");
  };

  // Calculate totals
  const subtotal = bookings.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.15 // 15% tax
  const total = subtotal + tax

  return (
    <div className="bg-background border rounded-md shadow-lg max-h-[80vh] overflow-y-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Your Bookings</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium mb-1">You have no bookings</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Looks like you haven't made any bookings yet.
            </p>
            <Button onClick={onClose} size="sm">
              Continue Browsing
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-3 mb-4">
              {bookings.map((item) => (
                <div key={item.id} className="flex gap-3 p-2 border rounded-lg">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center bg-muted">
                    {item.image === "plane" ? (
                        <Plane className="h-full w-full text-muted-foreground p-2" />
                      ) : (
                        <img src={item.image} alt={item.title} className="object-cover w-full h-full" />
                      )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-sm">{item.title}</h3>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeBooking(item.id)}>
                        <Trash className="h-3 w-3" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.details}</p>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-none"
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                          <span className="sr-only">Decrease</span>
                        </Button>
                        <span className="w-6 text-center text-xs">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-none"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                          <span className="sr-only">Increase</span>
                        </Button>
                      </div>
                      <span className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-muted/30 p-3 rounded-lg mb-4">
              <h3 className="font-medium text-sm mb-2">Order Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-xs">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Taxes & Fees</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {showPaymentForm ? (
              /* Payment Form */
              <form onSubmit={handleSubmit}>
                <h3 className="font-medium text-sm mb-3">Payment Details</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="cardNumber" className="text-xs">
                      Card Number
                    </Label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        maxLength={19} // 16 digits + 3 spaces
                        className={`text-sm h-9 ${errors.cardNumber ? "border-red-500" : ""}`}
                      />
                      <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {errors.cardNumber && <p className="text-xs text-red-500">{errors.cardNumber}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="cardName" className="text-xs">
                      Name on Card
                    </Label>
                    <Input
                      id="cardName"
                      name="cardName"
                      placeholder="John Doe"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      className={`text-sm h-9 ${errors.cardName ? "border-red-500" : ""}`}
                    />
                    {errors.cardName && <p className="text-xs text-red-500">{errors.cardName}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="expiry" className="text-xs">
                        Expiry Date
                      </Label>
                      <Input
                        id="expiry"
                        name="expiry"
                        placeholder="MM/YY"
                        value={formData.expiry}
                        onChange={handleInputChange}
                        maxLength={5}
                        className={`text-sm h-9 ${errors.expiry ? "border-red-500" : ""}`}
                      />
                      {errors.expiry && <p className="text-xs text-red-500">{errors.expiry}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="cvv" className="text-xs">
                        CVV
                      </Label>
                      <Input
                        id="cvv"
                        name="cvv"
                        type="password"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        maxLength={4}
                        className={`text-sm h-9 ${errors.cvv ? "border-red-500" : ""}`}
                      />
                      {errors.cvv && <p className="text-xs text-red-500">{errors.cvv}</p>}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowPaymentForm(false)}
                      type="button"
                    >
                      Back
                    </Button>
                    <Button type="submit" size="sm" className="flex-1 bg-sky-500 hover:bg-sky-600" disabled={isLoading}>
                      {isLoading ? "Processing..." : `Pay $${total.toFixed(2)}`}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
                  Continue Browsing
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-sky-500 hover:bg-sky-600"
                  onClick={() => setShowPaymentForm(true)}
                >
                  Checkout
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payment Successful</DialogTitle>
            </DialogHeader>
            <p>Your payment was successful! You can now download your invoice.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                Close
              </Button>
              <Button onClick={generateInvoice}>Download Invoice</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}



