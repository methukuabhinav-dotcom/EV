/**
 * REAL-TIME EV DATA (2024-2025)
 * Sources: Industry reports, manufacturer sites.
 */

export const EV_DATA = {
    Car: {
        brands: {
            "Tata Motors": [
                {
                    model: "Tiago EV",
                    image: "https://imgd.aeplcdn.com/664x374/n/cw/ec/131103/tiago-ev-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80",
                    price: 799000, subsidy: 50000, range: 315, battery: 24, charging: 6, speed: 120,
                    features: "Connected Car Tech, 8-speaker Harman System, Regenerative Braking, 2 Airbags, Auto Climate Control, 7-inch Touchscreen"
                },
                {
                    model: "Punch EV",
                    image: "https://imgd.aeplcdn.com/664x374/n/cw/ec/129679/punch-ev-exterior-right-front-three-quarter-2.jpeg?isig=0&q=80",
                    price: 1099000, subsidy: 60000, range: 421, battery: 35, charging: 5, speed: 140,
                    features: "Air Purifier, 360 Degree Camera, Ventilated Seats, Blind Spot Monitor, 10.25-inch Infotainment, Voice Assisted Sunroof"
                },
                {
                    model: "Nexon EV",
                    image: "https://imgd.aeplcdn.com/664x374/n/cw/ec/128389/nexon-ev-facelift-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80",
                    price: 1449000, subsidy: 80000, range: 465, battery: 40.5, charging: 6, speed: 150,
                    features: "V2L & V2V Charging, SOS Call, Cinematic Sound System by JBL, Arcade.ev App Suite, 6 Airbags, 360 Camera"
                }
            ],
            "MG Motors": [
                {
                    model: "Comet EV",
                    image: "https://imgd.aeplcdn.com/664x374/n/cw/ec/145893/comet-ev-exterior-right-front-three-quarter-2.jpeg?isig=0&q=80",
                    price: 699000, subsidy: 30000, range: 230, battery: 17.3, charging: 7, speed: 100,
                    features: "Digital Key with Share, i-Smart App, Twin 10.25-inch Displays, Wireless Android Auto/Apple CarPlay, Reverse Camera"
                },
                {
                    model: "ZS EV",
                    image: "https://imgd.aeplcdn.com/664x374/n/cw/ec/52565/zs-ev-exterior-right-front-three-quarter-33.jpeg?isig=0&q=80",
                    price: 1898000, subsidy: 90000, range: 461, battery: 50.3, charging: 8, speed: 175,
                    features: "Level 2 ADAS, Panoramic Sunroof, PM 2.5 Filter, 6-way Power Seat, 75+ Connected Car Features, Digital Cluster"
                }
            ],
            "Mahindra": [
                {
                    model: "XUV400",
                    image: "https://imgd.aeplcdn.com/664x374/n/cw/ec/136279/xuv400-exterior-right-front-three-quarter-2.jpeg?isig=0&q=80",
                    price: 1549000, subsidy: 75000, range: 456, battery: 39.4, charging: 6, speed: 150,
                    features: "Best-in-class 0-100 (8.3s), Widest Cabin in Segment, Electric Sunroof, 6 Airbags, ISOFIX, Smart Watch Connectivity"
                }
            ],
            "BYD": [
                {
                    model: "Seal",
                    image: "https://imgd.aeplcdn.com/664x374/n/cw/ec/149813/seal-exterior-right-front-three-quarter.jpeg?isig=0&q=80",
                    price: 4100000, subsidy: 150000, range: 650, battery: 82.5, charging: 1.2, speed: 180,
                    features: "Blade Battery Technology, Heads-up Display, 15.6-inch Rotating Screen, 12 Speakers, 5-Star Safety, Heated Seats"
                }
            ]
        }
    },
    Bike: {
        brands: {
            "Ola Electric": [
                {
                    model: "S1 Pro Gen 2",
                    image: "https://imgd.aeplcdn.com/664x374/n/cw/ec/129753/s1-pro-gen-2-exterior-right-front-three-quarter.jpeg?isig=0&q=80",
                    price: 134999, subsidy: 15000, range: 195, battery: 4, charging: 6.5, speed: 120,
                    features: "MoveOS 4, Hyper Mode, Cruise Control, Proximity Unlock, Built-in Speakers, Party Mode, Hill Hold"
                },
                {
                    model: "Roadster Pro",
                    image: "https://placehold.co/600x400/222/fff?text=Ola+Roadster",
                    price: 199999, subsidy: 20000, range: 250, battery: 8, charging: 7, speed: 194,
                    features: "Fastest electric bike in segment, Diamond Cut Alloys, ADAS Features (Projected), Liquid Cooled Motor"
                }
            ],
            "Ather Energy": [
                {
                    model: "450X 3.7kWh",
                    image: "https://imgd.aeplcdn.com/664x374/n/cw/ec/125015/450x-gen-3-exterior-right-front-three-quarter.jpeg?isig=0&q=80",
                    price: 154000, subsidy: 18000, range: 150, battery: 3.7, charging: 5.7, speed: 90,
                    features: "Google Maps Navigation, AutoHold, Fall Safe, Warp Mode, Dashboard with 4G, Park Assist, Document Storage"
                }
            ],
            "Revolt": [
                {
                    model: "RV400",
                    image: "https://imgd.aeplcdn.com/664x374/n/cw/ec/124843/rv400-exterior-right-front-three-quarter.jpeg?isig=0&q=80",
                    price: 142000, subsidy: 15000, range: 150, battery: 3.24, charging: 4.5, speed: 85,
                    features: "Removable Battery, 4 Artificial Exhaust Sounds, MyRevolt App, Geofencing, Bike Locator, Borderless Display"
                }
            ]
        }
    },
    Auto: {
        brands: {
            "Mahindra Auto": [
                { model: "Treo", image: "https://placehold.co/600x400/222/fff?text=Mahindra+Treo", price: 306000, subsidy: 40000, range: 141, battery: 7.37, charging: 4, speed: 45, features: "IP67 Rated Motor, Zero Maintenance Lithium Battery, Spacious Seating, Cloud Connectivity" }
            ],
            "Bajaj Auto": [
                { model: "RE E-TEC 9.0", image: "https://placehold.co/600x400/222/fff?text=Bajaj+RE+EV", price: 310000, subsidy: 35000, range: 178, battery: 8.9, charging: 4.5, speed: 45, features: "Metal Body, 2-Speed Automatic, Regenerative Braking, 5-Year Warranty" }
            ],
            "Piaggio": [
                { model: "Ape E-City FX", image: "https://placehold.co/600x400/222/fff?text=Piaggio+Ape", price: 330000, subsidy: 30000, range: 110, battery: 7.5, charging: 3.8, speed: 45, features: "Fixed Battery Technology, Hill Hold Assist, Telematics Unit, BlueVision Headlamps" }
            ]
        }
    },
    Bus: {
        brands: {
            "Olectra": [
                { model: "K9", image: "https://placehold.co/600x400/222/fff?text=Olectra+K9", price: 18000000, subsidy: 2000000, range: 300, battery: 200, charging: 2.5, speed: 80, features: "Air Suggested Suspension, Disc Brakes, Kneeling Mechanism, ITS Enabled" }
            ],
            "JBM": [
                { model: "ECO-LIFE", image: "https://placehold.co/600x400/222/fff?text=JBM+EcoLife", price: 16000000, subsidy: 1500000, range: 250, battery: 250, charging: 3, speed: 80, features: "Monocoque Chassis, Fast Charging capable, CCTV Surveillance, PIS System" }
            ],
            "Tata Motors": [
                { model: "Starbus EV", image: "https://placehold.co/600x400/222/fff?text=Tata+Starbus", price: 21000000, subsidy: 2500000, range: 200, battery: 186, charging: 4, speed: 75, features: "Integrated Cooling System, Telematics, Fire Detection System, Spacious Aisle" }
            ]
        }
    }
};
