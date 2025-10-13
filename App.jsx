import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { 
  Truck, 
  MapPin, 
  Clock, 
  Star, 
  Phone, 
  Mail, 
  User, 
  Package, 
  CreditCard,
  Shield,
  Zap,
  Users,
  BarChart3,
  Settings,
  MessageCircle,
  Navigation
} from 'lucide-react'
import './App.css'

// Header Component
function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Truck className="h-8 w-8 text-blue-600 mr-2" />
            <span className="text-2xl font-bold text-gray-900">Speedy Van</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
            <Link to="/services" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Services</Link>
            <Link to="/pricing" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Pricing</Link>
            <Link to="/track" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Track Order</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            <Button size="sm">Get Started</Button>
          </div>
        </div>
      </div>
    </header>
  )
}

// Hero Section
function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Fast & Reliable Delivery Service
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Professional delivery solutions across Glasgow and beyond
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              <Package className="h-5 w-5 mr-2" />
              Book Delivery
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Phone className="h-5 w-5 mr-2" />
              Call: 07901846297
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

// Booking Form Component
function BookingForm() {
  const [formData, setFormData] = useState({
    pickupAddress: '',
    deliveryAddress: '',
    packageDetails: '',
    deliveryTime: 'asap',
    contactName: '',
    contactPhone: '',
    contactEmail: ''
  })

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Booking submitted:', formData)
    alert('Booking request submitted! We will contact you shortly.')
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Book Your Delivery</h2>
          <p className="text-lg text-gray-600">Quick and easy booking process</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Delivery Details</CardTitle>
            <CardDescription>Fill in the details for your delivery request</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="pickupAddress">Pickup Address</Label>
                  <Input
                    id="pickupAddress"
                    name="pickupAddress"
                    value={formData.pickupAddress}
                    onChange={handleInputChange}
                    placeholder="Enter pickup address"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryAddress">Delivery Address</Label>
                  <Input
                    id="deliveryAddress"
                    name="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={handleInputChange}
                    placeholder="Enter delivery address"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="packageDetails">Package Details</Label>
                <Textarea
                  id="packageDetails"
                  name="packageDetails"
                  value={formData.packageDetails}
                  onChange={handleInputChange}
                  placeholder="Describe your package (size, weight, special instructions)"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Phone Number</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    placeholder="Your phone number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Email Address</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="Your email"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" size="lg">
                <Package className="h-5 w-5 mr-2" />
                Submit Booking Request
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="h-8 w-8 text-blue-600" />,
      title: "Fast Delivery",
      description: "Same-day and express delivery options available"
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      title: "Secure & Insured",
      description: "All deliveries are fully insured and tracked"
    },
    {
      icon: <Navigation className="h-8 w-8 text-blue-600" />,
      title: "Real-time Tracking",
      description: "Track your delivery in real-time with GPS"
    },
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: "Professional Drivers",
      description: "Experienced and vetted delivery professionals"
    },
    {
      icon: <CreditCard className="h-8 w-8 text-blue-600" />,
      title: "Flexible Payment",
      description: "Multiple payment options including card and cash"
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-blue-600" />,
      title: "24/7 Support",
      description: "Round-the-clock customer support"
    }
  ]

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Speedy Van?</h2>
          <p className="text-lg text-gray-600">Professional delivery services you can trust</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// User Portals Section
function UserPortals() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Access Your Portal</h2>
          <p className="text-lg text-gray-600">Dedicated portals for different user types</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-6 w-6 mr-2 text-blue-600" />
                Customer Portal
              </CardTitle>
              <CardDescription>
                Manage your bookings and track deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li>• Book new deliveries</li>
                <li>• Track order status</li>
                <li>• View delivery history</li>
                <li>• Manage payment methods</li>
              </ul>
              <Button className="w-full">Access Customer Portal</Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-6 w-6 mr-2 text-green-600" />
                Driver Portal
              </CardTitle>
              <CardDescription>
                Manage jobs and track earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li>• View available jobs</li>
                <li>• Update delivery status</li>
                <li>• Track earnings</li>
                <li>• Manage schedule</li>
              </ul>
              <Button className="w-full" variant="outline">Access Driver Portal</Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-6 w-6 mr-2 text-purple-600" />
                Admin Dashboard
              </CardTitle>
              <CardDescription>
                System management and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li>• System analytics</li>
                <li>• User management</li>
                <li>• Financial reports</li>
                <li>• System settings</li>
              </ul>
              <Button className="w-full" variant="outline">Access Admin Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

// Stats Section
function StatsSection() {
  const stats = [
    { number: "10,000+", label: "Deliveries Completed" },
    { number: "500+", label: "Happy Customers" },
    { number: "50+", label: "Professional Drivers" },
    { number: "99.9%", label: "On-Time Delivery" }
  ]

  return (
    <section className="py-16 bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
              <div className="text-blue-100">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Truck className="h-8 w-8 text-blue-400 mr-2" />
              <span className="text-2xl font-bold">Speedy Van</span>
            </div>
            <p className="text-gray-400 mb-4">
              Professional delivery services across Glasgow and beyond.
            </p>
            <div className="flex space-x-4">
              <Badge variant="secondary">Licensed</Badge>
              <Badge variant="secondary">Insured</Badge>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Same-day delivery</li>
              <li>Express delivery</li>
              <li>Scheduled delivery</li>
              <li>Bulk delivery</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li>About us</li>
              <li>Careers</li>
              <li>Terms of service</li>
              <li>Privacy policy</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-gray-400">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Office 2.18 1 Barrack St, Hamilton ML3 0HS
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                07901846297
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                support@speedy-van.co.uk
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Speedy Van. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

// Main App Component
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Header />
        <Routes>
          <Route path="/" element={
            <>
              <HeroSection />
              <BookingForm />
              <FeaturesSection />
              <UserPortals />
              <StatsSection />
            </>
          } />
        </Routes>
        <Footer />
      </div>
    </Router>
  )
}

export default App

