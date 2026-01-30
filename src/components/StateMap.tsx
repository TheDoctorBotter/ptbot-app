import React, { useState } from 'react';
import { MapPin, CheckCircle } from 'lucide-react';

export const StateMap = () => {
  const [hoveredState, setHoveredState] = useState<string>('');

  // States where Dr. Lemmo is actively licensed and practicing
  const activePracticeStates = ['Texas'];
  
  // States participating in PT Compact (as of 2024)
  const ptCompactStates = [
    'Alabama', 'Arizona', 'Colorado', 'Delaware', 'Georgia', 'Idaho', 'Illinois', 
    'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Maine', 'Maryland', 'Michigan', 
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'New Hampshire', 
    'New Jersey', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 
    'Pennsylvania', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 
    'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  const getStateFill = (stateName: string) => {
    if (activePracticeStates.includes(stateName)) {
      return '#C41E3A'; // Scarlet for active practice
    } else if (ptCompactStates.includes(stateName)) {
      return '#6B7280'; // Gray for PT Compact states
    } else {
      return '#F9FAFB'; // Light gray for non-compact states
    }
  };

  const getStateStroke = (stateName: string) => {
    if (activePracticeStates.includes(stateName)) {
      return '#B91C1C'; // Darker scarlet stroke for active states
    } else {
      return '#D1D5DB'; // Light gray stroke for all others
    }
  };

  const getStateStatus = (stateName: string) => {
    if (activePracticeStates.includes(stateName)) {
      return 'Active Practice - License #1215276';
    } else if (ptCompactStates.includes(stateName)) {
      return 'PT Compact State - Services Available';
    } else {
      return 'Services Not Available';
    }
  };

  const handleStateHover = (stateName: string) => {
    setHoveredState(stateName);
  };

  const handleStateLeave = () => {
    setHoveredState('');
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Licensed Practice Areas
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Virtual physical therapy services available through PT Compact licensing
          </p>
          <div className="inline-flex items-center bg-primary-50 px-4 py-2 rounded-lg">
            <CheckCircle className="h-5 w-5 text-primary-500 mr-2" />
            <span className="text-primary-800 font-medium">
              Texas License #1215276 - Dr. Justin Lemmo, PT, DPT
            </span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-8 mb-8 relative">
          <div className="w-full max-w-4xl mx-auto">
            <svg
              viewBox="0 0 1000 600"
              className="w-full h-auto"
              style={{ maxHeight: '500px' }}
            >
              {/* US States SVG Paths */}
              
              {/* Alaska */}
              <path
                d="M 158 458 L 124 458 L 110 440 L 95 425 L 85 410 L 80 395 L 85 380 L 95 365 L 110 350 L 130 340 L 150 335 L 170 340 L 185 350 L 195 365 L 200 380 L 195 395 L 185 410 L 170 425 L 158 440 Z"
                fill={getStateFill('Alaska')}
                stroke={getStateStroke('Alaska')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Alaska')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              
              {/* Hawaii */}
              <g>
                <circle cx="250" cy="450" r="3" fill={getStateFill('Hawaii')} stroke={getStateStroke('Hawaii')} strokeWidth="1" onMouseEnter={() => handleStateHover('Hawaii')} onMouseLeave={handleStateLeave} className="cursor-pointer hover:opacity-80 transition-opacity" />
                <circle cx="260" cy="455" r="2" fill={getStateFill('Hawaii')} stroke={getStateStroke('Hawaii')} strokeWidth="1" />
                <circle cx="270" cy="460" r="2" fill={getStateFill('Hawaii')} stroke={getStateStroke('Hawaii')} strokeWidth="1" />
                <circle cx="280" cy="465" r="2" fill={getStateFill('Hawaii')} stroke={getStateStroke('Hawaii')} strokeWidth="1" />
              </g>

              {/* Washington */}
              <path
                d="M 75 50 L 200 50 L 200 120 L 180 130 L 160 125 L 140 120 L 120 115 L 100 110 L 80 105 L 75 80 Z"
                fill={getStateFill('Washington')}
                stroke={getStateStroke('Washington')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Washington')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Oregon */}
              <path
                d="M 75 120 L 200 120 L 200 180 L 180 185 L 160 180 L 140 175 L 120 170 L 100 165 L 80 160 L 75 140 Z"
                fill={getStateFill('Oregon')}
                stroke={getStateStroke('Oregon')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Oregon')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* California */}
              <path
                d="M 75 180 L 200 180 L 190 250 L 180 320 L 170 390 L 160 460 L 150 530 L 140 520 L 130 510 L 120 500 L 110 490 L 100 480 L 90 470 L 80 460 L 70 450 L 60 440 L 50 430 L 45 420 L 50 410 L 55 400 L 60 390 L 65 380 L 70 370 L 75 360 L 80 350 L 85 340 L 90 330 L 95 320 L 100 310 L 105 300 L 110 290 L 115 280 L 120 270 L 125 260 L 130 250 L 135 240 L 140 230 L 145 220 L 150 210 L 155 200 L 160 190 L 165 180 Z"
                fill={getStateFill('California')}
                stroke={getStateStroke('California')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('California')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Nevada */}
              <path
                d="M 200 120 L 280 120 L 280 180 L 270 250 L 260 320 L 250 390 L 240 460 L 200 460 L 200 390 L 210 320 L 220 250 L 200 180 Z"
                fill={getStateFill('Nevada')}
                stroke={getStateStroke('Nevada')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Nevada')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Idaho */}
              <path
                d="M 200 50 L 280 50 L 280 120 L 270 130 L 260 140 L 250 150 L 240 160 L 230 170 L 220 180 L 210 190 L 200 200 L 200 120 Z"
                fill={getStateFill('Idaho')}
                stroke={getStateStroke('Idaho')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Idaho')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Montana */}
              <path
                d="M 280 50 L 450 50 L 450 120 L 440 130 L 430 140 L 420 150 L 410 160 L 400 170 L 390 180 L 380 190 L 370 200 L 360 210 L 350 220 L 340 230 L 330 240 L 320 250 L 310 260 L 300 270 L 290 280 L 280 290 L 280 120 Z"
                fill={getStateFill('Montana')}
                stroke={getStateStroke('Montana')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Montana')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Wyoming */}
              <path
                d="M 280 180 L 450 180 L 450 250 L 440 260 L 430 270 L 420 280 L 410 290 L 400 300 L 390 310 L 380 320 L 370 330 L 360 340 L 350 350 L 340 360 L 330 370 L 320 380 L 310 390 L 300 400 L 290 410 L 280 420 L 280 250 Z"
                fill={getStateFill('Wyoming')}
                stroke={getStateStroke('Wyoming')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Wyoming')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Colorado */}
              <path
                d="M 280 250 L 450 250 L 450 320 L 440 330 L 430 340 L 420 350 L 410 360 L 400 370 L 390 380 L 380 390 L 370 400 L 360 410 L 350 420 L 340 430 L 330 440 L 320 450 L 310 460 L 300 470 L 290 480 L 280 490 L 280 320 Z"
                fill={getStateFill('Colorado')}
                stroke={getStateStroke('Colorado')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Colorado')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* New Mexico */}
              <path
                d="M 280 320 L 450 320 L 450 460 L 440 470 L 430 480 L 420 490 L 410 500 L 400 510 L 390 520 L 380 530 L 370 540 L 360 550 L 350 560 L 340 570 L 330 580 L 320 590 L 310 600 L 300 610 L 290 620 L 280 630 L 280 460 Z"
                fill={getStateFill('New Mexico')}
                stroke={getStateStroke('New Mexico')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('New Mexico')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Utah */}
              <path
                d="M 280 180 L 350 180 L 350 320 L 340 330 L 330 340 L 320 350 L 310 360 L 300 370 L 290 380 L 280 390 L 280 250 Z"
                fill={getStateFill('Utah')}
                stroke={getStateStroke('Utah')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Utah')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Arizona */}
              <path
                d="M 280 320 L 350 320 L 350 460 L 340 470 L 330 480 L 320 490 L 310 500 L 300 510 L 290 520 L 280 530 L 280 390 Z"
                fill={getStateFill('Arizona')}
                stroke={getStateStroke('Arizona')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Arizona')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* North Dakota */}
              <path
                d="M 450 50 L 550 50 L 550 120 L 540 130 L 530 140 L 520 150 L 510 160 L 500 170 L 490 180 L 480 190 L 470 200 L 460 210 L 450 220 L 450 120 Z"
                fill={getStateFill('North Dakota')}
                stroke={getStateStroke('North Dakota')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('North Dakota')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* South Dakota */}
              <path
                d="M 450 120 L 550 120 L 550 180 L 540 190 L 530 200 L 520 210 L 510 220 L 500 230 L 490 240 L 480 250 L 470 260 L 460 270 L 450 280 L 450 180 Z"
                fill={getStateFill('South Dakota')}
                stroke={getStateStroke('South Dakota')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('South Dakota')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Nebraska */}
              <path
                d="M 450 180 L 550 180 L 550 240 L 540 250 L 530 260 L 520 270 L 510 280 L 500 290 L 490 300 L 480 310 L 470 320 L 460 330 L 450 340 L 450 240 Z"
                fill={getStateFill('Nebraska')}
                stroke={getStateStroke('Nebraska')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Nebraska')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Kansas */}
              <path
                d="M 450 240 L 550 240 L 550 300 L 540 310 L 530 320 L 520 330 L 510 340 L 500 350 L 490 360 L 480 370 L 470 380 L 460 390 L 450 400 L 450 300 Z"
                fill={getStateFill('Kansas')}
                stroke={getStateStroke('Kansas')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Kansas')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Oklahoma */}
              <path
                d="M 450 300 L 550 300 L 580 300 L 580 360 L 570 370 L 560 380 L 550 390 L 540 400 L 530 410 L 520 420 L 510 430 L 500 440 L 490 450 L 480 460 L 470 470 L 460 480 L 450 490 L 450 360 Z"
                fill={getStateFill('Oklahoma')}
                stroke={getStateStroke('Oklahoma')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Oklahoma')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Texas */}
              <path
                d="M 450 360 L 580 360 L 580 420 L 570 430 L 560 440 L 550 450 L 540 460 L 530 470 L 520 480 L 510 490 L 500 500 L 490 510 L 480 520 L 470 530 L 460 540 L 450 550 L 440 560 L 430 570 L 420 580 L 410 590 L 400 600 L 390 590 L 380 580 L 370 570 L 360 560 L 350 550 L 340 540 L 330 530 L 320 520 L 310 510 L 300 500 L 290 490 L 280 480 L 280 460 L 290 450 L 300 440 L 310 430 L 320 420 L 330 410 L 340 400 L 350 390 L 360 380 L 370 370 L 380 360 L 390 350 L 400 340 L 410 330 L 420 320 L 430 310 L 440 300 L 450 290 Z"
                fill={getStateFill('Texas')}
                stroke={getStateStroke('Texas')}
                strokeWidth="2"
                onMouseEnter={() => handleStateHover('Texas')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Minnesota */}
              <path
                d="M 550 50 L 650 50 L 650 120 L 640 130 L 630 140 L 620 150 L 610 160 L 600 170 L 590 180 L 580 190 L 570 200 L 560 210 L 550 220 L 550 120 Z"
                fill={getStateFill('Minnesota')}
                stroke={getStateStroke('Minnesota')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Minnesota')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Iowa */}
              <path
                d="M 550 180 L 650 180 L 650 240 L 640 250 L 630 260 L 620 270 L 610 280 L 600 290 L 590 300 L 580 310 L 570 320 L 560 330 L 550 340 L 550 240 Z"
                fill={getStateFill('Iowa')}
                stroke={getStateStroke('Iowa')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Iowa')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Missouri */}
              <path
                d="M 550 240 L 650 240 L 680 240 L 680 300 L 670 310 L 660 320 L 650 330 L 640 340 L 630 350 L 620 360 L 610 370 L 600 380 L 590 390 L 580 400 L 570 410 L 560 420 L 550 430 L 550 300 Z"
                fill={getStateFill('Missouri')}
                stroke={getStateStroke('Missouri')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Missouri')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Arkansas */}
              <path
                d="M 580 300 L 680 300 L 680 360 L 670 370 L 660 380 L 650 390 L 640 400 L 630 410 L 620 420 L 610 430 L 600 440 L 590 450 L 580 460 L 580 360 Z"
                fill={getStateFill('Arkansas')}
                stroke={getStateStroke('Arkansas')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Arkansas')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Louisiana */}
              <path
                d="M 580 420 L 680 420 L 680 480 L 670 490 L 660 500 L 650 510 L 640 520 L 630 530 L 620 540 L 610 550 L 600 560 L 590 570 L 580 580 L 580 480 Z"
                fill={getStateFill('Louisiana')}
                stroke={getStateStroke('Louisiana')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Louisiana')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Wisconsin */}
              <path
                d="M 650 50 L 720 50 L 720 120 L 710 130 L 700 140 L 690 150 L 680 160 L 670 170 L 660 180 L 650 190 L 650 120 Z"
                fill={getStateFill('Wisconsin')}
                stroke={getStateStroke('Wisconsin')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Wisconsin')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Illinois */}
              <path
                d="M 650 180 L 720 180 L 720 300 L 710 310 L 700 320 L 690 330 L 680 340 L 670 350 L 660 360 L 650 370 L 650 240 Z"
                fill={getStateFill('Illinois')}
                stroke={getStateStroke('Illinois')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Illinois')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Michigan */}
              <path
                d="M 720 50 L 780 50 L 780 120 L 770 130 L 760 140 L 750 150 L 740 160 L 730 170 L 720 180 L 720 120 Z M 720 200 L 780 200 L 780 280 L 770 290 L 760 300 L 750 310 L 740 320 L 730 330 L 720 340 L 720 260 Z"
                fill={getStateFill('Michigan')}
                stroke={getStateStroke('Michigan')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Michigan')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Indiana */}
              <path
                d="M 720 180 L 780 180 L 780 300 L 770 310 L 760 320 L 750 330 L 740 340 L 730 350 L 720 360 L 720 240 Z"
                fill={getStateFill('Indiana')}
                stroke={getStateStroke('Indiana')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Indiana')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Ohio */}
              <path
                d="M 780 180 L 850 180 L 850 300 L 840 310 L 830 320 L 820 330 L 810 340 L 800 350 L 790 360 L 780 370 L 780 240 Z"
                fill={getStateFill('Ohio')}
                stroke={getStateStroke('Ohio')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Ohio')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Kentucky */}
              <path
                d="M 680 300 L 850 300 L 850 360 L 840 370 L 830 380 L 820 390 L 810 400 L 800 410 L 790 420 L 780 430 L 770 440 L 760 450 L 750 460 L 740 470 L 730 480 L 720 490 L 710 500 L 700 510 L 690 520 L 680 530 L 680 360 Z"
                fill={getStateFill('Kentucky')}
                stroke={getStateStroke('Kentucky')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Kentucky')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Tennessee */}
              <path
                d="M 680 360 L 850 360 L 850 420 L 840 430 L 830 440 L 820 450 L 810 460 L 800 470 L 790 480 L 780 490 L 770 500 L 760 510 L 750 520 L 740 530 L 730 540 L 720 550 L 710 560 L 700 570 L 690 580 L 680 590 L 680 420 Z"
                fill={getStateFill('Tennessee')}
                stroke={getStateStroke('Tennessee')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Tennessee')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Mississippi */}
              <path
                d="M 680 420 L 720 420 L 720 540 L 710 550 L 700 560 L 690 570 L 680 580 L 680 480 Z"
                fill={getStateFill('Mississippi')}
                stroke={getStateStroke('Mississippi')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Mississippi')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Alabama */}
              <path
                d="M 720 420 L 780 420 L 780 540 L 770 550 L 760 560 L 750 570 L 740 580 L 730 590 L 720 600 L 720 480 Z"
                fill={getStateFill('Alabama')}
                stroke={getStateStroke('Alabama')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Alabama')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Georgia */}
              <path
                d="M 780 420 L 850 420 L 850 540 L 840 550 L 830 560 L 820 570 L 810 580 L 800 590 L 790 600 L 780 590 L 780 480 Z"
                fill={getStateFill('Georgia')}
                stroke={getStateStroke('Georgia')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Georgia')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Florida */}
              <path
                d="M 780 540 L 850 540 L 880 540 L 900 550 L 920 560 L 940 570 L 950 580 L 940 590 L 920 600 L 900 590 L 880 580 L 860 570 L 840 560 L 820 550 L 800 540 L 780 530 Z"
                fill={getStateFill('Florida')}
                stroke={getStateStroke('Florida')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Florida')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* South Carolina */}
              <path
                d="M 850 420 L 900 420 L 900 480 L 890 490 L 880 500 L 870 510 L 860 520 L 850 530 L 850 480 Z"
                fill={getStateFill('South Carolina')}
                stroke={getStateStroke('South Carolina')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('South Carolina')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* North Carolina */}
              <path
                d="M 850 360 L 950 360 L 950 420 L 940 430 L 930 440 L 920 450 L 910 460 L 900 470 L 890 480 L 880 490 L 870 500 L 860 510 L 850 520 L 850 420 Z"
                fill={getStateFill('North Carolina')}
                stroke={getStateStroke('North Carolina')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('North Carolina')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Virginia */}
              <path
                d="M 850 300 L 950 300 L 950 360 L 940 370 L 930 380 L 920 390 L 910 400 L 900 410 L 890 420 L 880 430 L 870 440 L 860 450 L 850 460 L 850 360 Z"
                fill={getStateFill('Virginia')}
                stroke={getStateStroke('Virginia')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Virginia')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* West Virginia */}
              <path
                d="M 850 240 L 900 240 L 900 300 L 890 310 L 880 320 L 870 330 L 860 340 L 850 350 L 850 300 Z"
                fill={getStateFill('West Virginia')}
                stroke={getStateStroke('West Virginia')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('West Virginia')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Pennsylvania */}
              <path
                d="M 850 180 L 950 180 L 950 240 L 940 250 L 930 260 L 920 270 L 910 280 L 900 290 L 890 300 L 880 310 L 870 320 L 860 330 L 850 340 L 850 240 Z"
                fill={getStateFill('Pennsylvania')}
                stroke={getStateStroke('Pennsylvania')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Pennsylvania')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* New York */}
              <path
                d="M 850 120 L 950 120 L 950 180 L 940 190 L 930 200 L 920 210 L 910 220 L 900 230 L 890 240 L 880 250 L 870 260 L 860 270 L 850 280 L 850 180 Z"
                fill={getStateFill('New York')}
                stroke={getStateStroke('New York')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('New York')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Vermont */}
              <path
                d="M 950 120 L 970 120 L 970 180 L 960 190 L 950 200 L 950 180 Z"
                fill={getStateFill('Vermont')}
                stroke={getStateStroke('Vermont')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Vermont')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* New Hampshire */}
              <path
                d="M 970 120 L 990 120 L 990 200 L 980 210 L 970 220 L 970 180 Z"
                fill={getStateFill('New Hampshire')}
                stroke={getStateStroke('New Hampshire')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('New Hampshire')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Maine */}
              <path
                d="M 990 50 L 1000 50 L 1000 200 L 990 210 L 980 220 L 970 230 L 960 240 L 950 250 L 940 260 L 930 270 L 920 280 L 910 290 L 900 300 L 890 310 L 880 320 L 870 330 L 860 340 L 850 350 L 840 360 L 830 370 L 820 380 L 810 390 L 800 400 L 790 410 L 780 420 L 770 430 L 760 440 L 750 450 L 740 460 L 730 470 L 720 480 L 710 490 L 700 500 L 690 510 L 680 520 L 670 530 L 660 540 L 650 550 L 640 560 L 630 570 L 620 580 L 610 590 L 600 600 L 990 120 Z"
                fill={getStateFill('Maine')}
                stroke={getStateStroke('Maine')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Maine')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Massachusetts */}
              <path
                d="M 950 180 L 1000 180 L 1000 200 L 990 210 L 980 220 L 970 230 L 960 240 L 950 250 L 950 200 Z"
                fill={getStateFill('Massachusetts')}
                stroke={getStateStroke('Massachusetts')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Massachusetts')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Connecticut */}
              <path
                d="M 950 200 L 980 200 L 980 220 L 970 230 L 960 240 L 950 250 L 950 220 Z"
                fill={getStateFill('Connecticut')}
                stroke={getStateStroke('Connecticut')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Connecticut')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Rhode Island */}
              <path
                d="M 980 200 L 990 200 L 990 220 L 980 230 L 980 220 Z"
                fill={getStateFill('Rhode Island')}
                stroke={getStateStroke('Rhode Island')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Rhode Island')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* New Jersey */}
              <path
                d="M 950 240 L 980 240 L 980 300 L 970 310 L 960 320 L 950 330 L 950 300 Z"
                fill={getStateFill('New Jersey')}
                stroke={getStateStroke('New Jersey')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('New Jersey')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Delaware */}
              <path
                d="M 950 300 L 970 300 L 970 340 L 960 350 L 950 360 L 950 330 Z"
                fill={getStateFill('Delaware')}
                stroke={getStateStroke('Delaware')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Delaware')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Maryland */}
              <path
                d="M 900 300 L 950 300 L 950 340 L 940 350 L 930 360 L 920 370 L 910 380 L 900 390 L 900 360 Z"
                fill={getStateFill('Maryland')}
                stroke={getStateStroke('Maryland')}
                strokeWidth="1"
                onMouseEnter={() => handleStateHover('Maryland')}
                onMouseLeave={handleStateLeave}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />

              {/* Hover tooltip */}
              {hoveredState && (
                <g>
                  <rect
                    x="20"
                    y="20"
                    width="280"
                    height="80"
                    fill="white"
                    stroke="#D1D5DB"
                    strokeWidth="1"
                    rx="8"
                    className="drop-shadow-lg"
                  />
                  <text x="30" y="45" className="text-lg font-semibold fill-gray-900">
                    {hoveredState}
                  </text>
                  <text x="30" y="65" className="text-sm fill-gray-600">
                    {getStateStatus(hoveredState)}
                  </text>
                  {activePracticeStates.includes(hoveredState) && (
                    <text x="30" y="85" className="text-xs fill-blue-600 font-medium">
                      License #1215276
                    </text>
                  )}
                </g>
              )}
            </svg>
          </div>
          
          <div className="flex justify-center mt-6 space-x-8 flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-primary-500 rounded mr-2"></div>
              <span className="text-sm text-gray-700">Active Practice (Licensed)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-600 rounded mr-2"></div>
              <span className="text-sm text-gray-700">PT Compact States</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></div>
              <span className="text-sm text-gray-700">Non-Compact States</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-primary-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-3">Currently Licensed</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-primary-500 mr-2" />
                <span className="text-primary-800">Texas (License #1215276)</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">PT Compact Expansion</h3>
            <p className="text-gray-700 text-sm mb-3">
              Services are expanding to additional PT Compact states. The Physical Therapy Compact allows 
              licensed PTs to practice across participating states with streamlined licensing.
            </p>
            <a
              href="mailto:justinlemmodpt@gmail.com?subject=PT Compact State Inquiry"
              className="inline-flex items-center text-primary-500 hover:text-primary-600 font-medium text-sm"
            >
              <MapPin className="h-4 w-4 mr-1" />
              Inquire about services in your state
            </a>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            <strong>Note:</strong> Virtual physical therapy services are only available to residents of states 
            where Dr. Lemmo holds an active license or PT Compact privilege. Please confirm your state of 
            residence before scheduling services.
          </p>
        </div>
      </div>
    </section>
  );
};