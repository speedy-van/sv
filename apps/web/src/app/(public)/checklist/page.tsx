/**
 * Moving Checklist Page
 * 
 * Interactive moving checklist with downloadable PDF
 * Target keywords: "moving checklist", "moving checklist pdf", "house moving checklist"
 */

'use client';

import { useState } from 'react';

export default function ChecklistPage() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const downloadPDF = () => {
    // In production, this would generate and download a PDF
    alert('PDF download functionality - integrate with PDF generation service');
  };

  const progress = Math.round((checkedItems.size / getTotalItems()) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-800 text-white py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Complete Moving Checklist
          </h1>
          <p className="text-xl md:text-2xl text-green-100 max-w-3xl mb-8">
            Stay organized with our comprehensive moving checklist. Track your progress and never forget a task!
          </p>
          <button
            onClick={downloadPDF}
            className="bg-white text-green-600 px-8 py-4 rounded-lg font-bold hover:bg-green-50 transition inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF Checklist
          </button>
        </div>
      </section>

      {/* Progress Bar */}
      <section className="bg-white py-6 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Your Progress</span>
            <span className="text-sm font-bold text-green-600">{progress}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      {/* Checklist Sections */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {checklistSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-12">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className={`p-6 ${section.color}`}>
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <span className="text-3xl mr-4">{section.icon}</span>
                    {section.title}
                  </h2>
                  <p className="text-white/90 mt-2">{section.subtitle}</p>
                </div>
                
                <div className="p-6">
                  {section.items.map((item, itemIndex) => {
                    const itemId = `${sectionIndex}-${itemIndex}`;
                    const isChecked = checkedItems.has(itemId);
                    
                    return (
                      <div
                        key={itemIndex}
                        className={`flex items-start p-4 rounded-lg mb-2 cursor-pointer transition ${
                          isChecked ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => toggleItem(itemId)}
                      >
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            isChecked ? 'bg-green-600 border-green-600' : 'border-gray-300'
                          }`}>
                            {isChecked && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4 flex-1">
                          <p className={`font-medium ${isChecked ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                            {item.task}
                          </p>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                          {item.tip && (
                            <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                              <p className="text-sm text-yellow-800">
                                <strong>💡 Tip:</strong> {item.tip}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Book Your Move?</h2>
          <p className="text-xl mb-8 text-green-100">
            Get an instant quote in under 60 seconds
          </p>
          <a 
            href="/book" 
            className="bg-white text-green-600 px-8 py-4 rounded-lg font-bold hover:bg-green-50 transition inline-block"
          >
            Get Instant Quote →
          </a>
        </div>
      </section>
    </div>
  );
}

function getTotalItems(): number {
  return checklistSections.reduce((total, section) => total + section.items.length, 0);
}

const checklistSections = [
  {
    title: '8 Weeks Before Moving',
    subtitle: 'Start planning early for a stress-free move',
    icon: '📅',
    color: 'bg-blue-600',
    items: [
      {
        task: 'Create a moving budget',
        description: 'Estimate costs for movers, packing supplies, and unexpected expenses',
        tip: 'Add 10-15% buffer for unexpected costs',
      },
      {
        task: 'Research moving companies',
        description: 'Get quotes from at least 3 reputable moving companies',
      },
      {
        task: 'Start decluttering',
        description: 'Go through each room and decide what to keep, donate, or sell',
        tip: 'Use the 6-month rule: if you haven\'t used it in 6 months, consider letting it go',
      },
      {
        task: 'Notify landlord (if renting)',
        description: 'Give proper notice as per your tenancy agreement',
      },
      {
        task: 'Research schools in new area',
        description: 'If you have children, start looking into school options',
      },
    ],
  },
  {
    title: '6 Weeks Before Moving',
    subtitle: 'Time to start organizing and booking',
    icon: '📋',
    color: 'bg-purple-600',
    items: [
      {
        task: 'Book your moving company',
        description: 'Confirm date, time, and services with your chosen mover',
        tip: 'Book early to get your preferred date and better rates',
      },
      {
        task: 'Order packing supplies',
        description: 'Boxes, tape, bubble wrap, markers, and labels',
      },
      {
        task: 'Update your address',
        description: 'Notify banks, insurance, subscriptions, and government agencies',
      },
      {
        task: 'Arrange school transfers',
        description: 'Complete paperwork for children\'s school transfers',
      },
      {
        task: 'Book time off work',
        description: 'Request leave for moving day and settling in',
      },
      {
        task: 'Start packing non-essentials',
        description: 'Pack items you won\'t need in the next 6 weeks',
      },
    ],
  },
  {
    title: '4 Weeks Before Moving',
    subtitle: 'Ramp up preparations',
    icon: '📦',
    color: 'bg-orange-600',
    items: [
      {
        task: 'Confirm moving date',
        description: 'Double-check with moving company and confirm all details',
      },
      {
        task: 'Arrange utilities at new home',
        description: 'Set up gas, electric, water, internet, and TV',
        tip: 'Schedule connections for the day before you move in',
      },
      {
        task: 'Register with new GP and dentist',
        description: 'Find and register with healthcare providers in your new area',
      },
      {
        task: 'Notify current utilities',
        description: 'Give notice to current providers and schedule disconnections',
      },
      {
        task: 'Pack more rooms',
        description: 'Continue packing rooms you use less frequently',
      },
      {
        task: 'Arrange pet care',
        description: 'Plan for pets on moving day - consider boarding or a pet sitter',
      },
    ],
  },
  {
    title: '2 Weeks Before Moving',
    subtitle: 'Final preparations',
    icon: '✅',
    color: 'bg-green-600',
    items: [
      {
        task: 'Confirm all bookings',
        description: 'Reconfirm with movers, utilities, and any other services',
      },
      {
        task: 'Pack most rooms',
        description: 'Pack everything except daily essentials',
      },
      {
        task: 'Use up frozen food',
        description: 'Start using items from freezer and pantry',
      },
      {
        task: 'Arrange parking permits',
        description: 'If needed, arrange parking for moving van at both properties',
      },
      {
        task: 'Take meter readings',
        description: 'Record gas, electric, and water meter readings',
      },
      {
        task: 'Prepare "first night" box',
        description: 'Pack essentials you\'ll need immediately at new home',
        tip: 'Include toiletries, chargers, snacks, and a change of clothes',
      },
    ],
  },
  {
    title: '1 Week Before Moving',
    subtitle: 'Final countdown',
    icon: '⏰',
    color: 'bg-red-600',
    items: [
      {
        task: 'Pack remaining items',
        description: 'Pack everything except absolute essentials',
      },
      {
        task: 'Defrost freezer',
        description: 'Clean and defrost refrigerator and freezer',
      },
      {
        task: 'Confirm moving day details',
        description: 'Final confirmation with movers on time and address',
      },
      {
        task: 'Prepare payment',
        description: 'Have cash ready for tipping movers',
      },
      {
        task: 'Clean current home',
        description: 'Start deep cleaning rooms as they\'re emptied',
      },
    ],
  },
  {
    title: 'Moving Day',
    subtitle: 'The big day!',
    icon: '🚚',
    color: 'bg-yellow-600',
    items: [
      {
        task: 'Do final walkthrough',
        description: 'Check all rooms, cupboards, and storage spaces',
      },
      {
        task: 'Take final meter readings',
        description: 'Record and photograph all meter readings',
      },
      {
        task: 'Hand over keys',
        description: 'Return keys to landlord or estate agent',
      },
      {
        task: 'Supervise loading',
        description: 'Be present to answer questions and direct movers',
      },
      {
        task: 'Check inventory',
        description: 'Verify all items are loaded',
      },
      {
        task: 'Secure old property',
        description: 'Lock all windows and doors',
      },
    ],
  },
  {
    title: 'After Moving',
    subtitle: 'Settling into your new home',
    icon: '🏠',
    color: 'bg-indigo-600',
    items: [
      {
        task: 'Check utilities are working',
        description: 'Test gas, electric, water, heating, and internet',
      },
      {
        task: 'Test safety devices',
        description: 'Check smoke alarms and carbon monoxide detectors',
      },
      {
        task: 'Locate important features',
        description: 'Find stopcock, fuse box, and boiler',
      },
      {
        task: 'Unpack essentials first',
        description: 'Set up beds, bathroom, and kitchen basics',
      },
      {
        task: 'Update driving license',
        description: 'Change address on driving license within 2 weeks',
      },
      {
        task: 'Register to vote',
        description: 'Update electoral register with new address',
      },
      {
        task: 'Meet the neighbors',
        description: 'Introduce yourself to neighbors',
      },
      {
        task: 'Explore local area',
        description: 'Find nearest shops, GP, pharmacy, and amenities',
      },
    ],
  },
];

