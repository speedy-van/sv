import React, { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { 
  MapPin, 
  Calendar, 
  Package, 
  Star, 
  Shield, 
  Clock, 
  Phone,
  CheckCircle2,
  ArrowRight,
  Home,
  Building,
  Warehouse,
  Truck
} from 'lucide-react'
import './App.css'

function App() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedService, setSelectedService] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [selectedItems, setSelectedItems] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [estimatedPrice, setEstimatedPrice] = useState(150)

  const serviceTypes = [
    {
      id: 'signature',
      name: 'Signature',
      price: 50,
      description: 'Our standard high-quality service',
      features: ['Professional drivers', 'Fully insured', 'Real-time tracking']
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 100,
      description: 'Enhanced service with dedicated coordinator',
      features: ['Dedicated coordinator', 'Packing materials', 'Priority scheduling', 'SMS updates']
    },
    {
      id: 'white-glove',
      name: 'White Glove',
      price: 200,
      description: 'Fully managed, all-inclusive experience',
      features: ['Personal concierge', 'Full packing service', 'Furniture assembly', 'Post-move cleaning']
    }
  ]

  const sampleItems = [
    { id: 1, name: 'Sofa', category: 'furniture', weight: '80kg', volume: '2.5m³', price: 25 },
    { id: 2, name: 'Washing Machine', category: 'appliances', weight: '70kg', volume: '1.2m³', price: 30 },
    { id: 3, name: 'Television', category: 'electronics', weight: '25kg', volume: '0.8m³', price: 15 },
    { id: 4, name: 'Bed', category: 'furniture', weight: '90kg', volume: '3.5m³', price: 35 },
    { id: 5, name: 'Medium Box', category: 'boxes', weight: '4kg', volume: '0.2m³', price: 5 },
    { id: 6, name: 'Refrigerator', category: 'appliances', weight: '80kg', volume: '2m³', price: 40 }
  ]

  const timeSlots = [
    { id: 'morning', label: 'Morning', time: '8:00 - 12:00', icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', time: '12:00 - 17:00', icon: '☀️' },
    { id: 'evening', label: 'Evening', time: '17:00 - 20:00', icon: '🌆' },
    { id: 'flexible', label: 'Flexible', time: 'Any time', icon: '🕐' }
  ]

  const addItem = (item) => {
    const existingItem = selectedItems.find(i => i.id === item.id)
    if (existingItem) {
      setSelectedItems(selectedItems.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ))
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }])
    }
    updatePrice()
  }

  const removeItem = (itemId) => {
    setSelectedItems(selectedItems.filter(i => i.id !== itemId))
    updatePrice()
  }

  const updatePrice = () => {
    const basePrice = serviceTypes.find(s => s.id === selectedService)?.price || 50
    const itemsPrice = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0)
    setEstimatedPrice(basePrice + itemsPrice)
  }

  const Step1 = () => (
    <div className="space-y-8">
      {/* Service Level Selection */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Service Level</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {serviceTypes.map((service) => (
            <Card 
              key={service.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedService === service.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => {
                setSelectedService(service.id)
                updatePrice()
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {service.name}
                  <Badge variant="outline">£{service.price}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Address Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-500" />
              Pickup Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="pickup">Where should we collect your items?</Label>
                <Input 
                  id="pickup"
                  placeholder="Enter pickup address or postcode"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-1" />
                  Home
                </Button>
                <Button variant="outline" size="sm">
                  <Building className="w-4 h-4 mr-1" />
                  Office
                </Button>
                <Button variant="outline" size="sm">
                  <Warehouse className="w-4 h-4 mr-1" />
                  Storage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-green-500" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="delivery">Where should we deliver your items?</Label>
                <Input 
                  id="delivery"
                  placeholder="Enter delivery address or postcode"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-1" />
                  Home
                </Button>
                <Button variant="outline" size="sm">
                  <Building className="w-4 h-4 mr-1" />
                  Office
                </Button>
                <Button variant="outline" size="sm">
                  <Warehouse className="w-4 h-4 mr-1" />
                  Storage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2 text-purple-500" />
            What are we moving?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input placeholder="Search items (e.g., sofa, washing machine, boxes)" />
            <div className="grid md:grid-cols-3 gap-4">
              {sampleItems.map((item) => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{item.name}</h4>
                      <Badge variant="outline">£{item.price}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      <p>Weight: {item.weight}</p>
                      <p>Volume: {item.volume}</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => addItem(item)}
                    >
                      Add Item
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date & Time Selection */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-orange-500" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-500" />
              Select Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.id}
                  variant={selectedTime === slot.id ? "default" : "outline"}
                  className="flex flex-col p-4 h-auto"
                  onClick={() => setSelectedTime(slot.id)}
                >
                  <span className="text-lg mb-1">{slot.icon}</span>
                  <span className="font-medium">{slot.label}</span>
                  <span className="text-xs">{slot.time}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const Step2 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Personalize & Confirm</h2>
        <p className="text-muted-foreground">Review your booking and complete your luxury move</p>
      </div>

      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Service Level:</span>
              <Badge>{serviceTypes.find(s => s.id === selectedService)?.name}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Pickup:</span>
              <span className="text-right">{pickupAddress || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery:</span>
              <span className="text-right">{deliveryAddress || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span>Date & Time:</span>
              <span>{selectedDate} - {timeSlots.find(t => t.id === selectedTime)?.label}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Estimate:</span>
              <span>£{estimatedPrice}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{item.name} x{item.quantity}</span>
                  <div className="flex items-center space-x-2">
                    <span>£{item.price * item.quantity}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Details */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="Enter your first name" />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Enter your last name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="Enter your phone number" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Special Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Special Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea 
            className="w-full p-3 border rounded-md"
            rows="4"
            placeholder="Any special instructions or requests for your move..."
          />
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Speedy Van</h1>
                <p className="text-sm text-gray-600">Premium Moving Services</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>Fully Insured</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>5-Star Rated</span>
              </div>
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                Call Us
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="font-medium">Your Bespoke Move Plan</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="font-medium">Personalize & Confirm</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Estimated Total</div>
              <div className="text-2xl font-bold text-blue-600">£{estimatedPrice}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentStep === 1 ? <Step1 /> : <Step2 />}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Why Choose Speedy Van?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Fully Insured</h4>
                      <p className="text-sm text-muted-foreground">£50k coverage included</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Star className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">5-Star Service</h4>
                      <p className="text-sm text-muted-foreground">Rated by 50,000+ customers</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">On-Time Guarantee</h4>
                      <p className="text-sm text-muted-foreground">95% on-time delivery rate</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Call 020 3746 7798
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Our experts are here to help you plan your perfect move
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(1)}
            disabled={currentStep === 1}
          >
            Previous Step
          </Button>
          <Button 
            onClick={() => {
              if (currentStep === 1) {
                setCurrentStep(2)
              } else {
                alert('Booking confirmed! Thank you for choosing Speedy Van.')
              }
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === 1 ? 'Continue to Confirmation' : 'Confirm Booking'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default App
