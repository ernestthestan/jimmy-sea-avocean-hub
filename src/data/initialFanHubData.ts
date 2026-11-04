import type { FanClub, FoodSupportProject } from '../types/fanhub';

export const INITIAL_FAN_CLUBS: FanClub[] = [];


export const INITIAL_FOOD_SUPPORT_PROJECTS: FoodSupportProject[] = [
  {
    id: 'proj-avocean-annual-2026',
    title: 'Avocean Family Annual Celebration & Production Crew Food Truck',
    actor: 'everyone',
    supportType: 'food_truck',
    status: 'open',
    eventName: 'JimmySea & Avocean Annual Celebration',
    eventDate: '2026-12-20',
    location: 'GMMTV Building & Shooting Location, Bangkok',
    organizerName: 'Avocean Worldwide Union (Global NomNoms & Avoceans)',
    organizerContactUrl: 'https://x.com/Avocean_Official',
    description: 'จัดรถฟู้ดทรัคพรีเมียม 3-in-1 บริการเบอร์เกอร์อโวคาโดโฮมเมด ลาเต้คาราเมลเกลือทะเล และถ้วยของหวานซิกเนเจอร์สำหรับจิมมี่-ซี และทีมงานกองถ่ายทุกคน',
    translatedDescription: 'Providing a 3-in-1 premium food truck with artisan avocado burgers, sea-salt iced caramel lattes, and customized dessert cups for Jimmy, Sea, their management, and entire production staff.',
    targetAmount: 50000,
    currentAmount: 32000,
    currency: 'THB',
    donationUrl: 'https://x.com/Avocean_Official',
    announcementUrl: 'https://x.com/Avocean_Official',
    deliveryNotes: 'กำลังประสานงานจุดจอดรถหน้าตึก GMM และแพ็กเกจของขวัญพิเศษประจำปี 2026',
    translatedDeliveryNotes: 'Currently coordinating parking access at GMMTV building and preparing the special 2026 annual celebratory gift packs for the team.',
    hashtags: '#JimmySea #AVOCEAN #jimmyyjp #sea_tawinan',
    proofMedia: [],
    createdAt: '2026-10-25T08:00:00.000Z'
  },
  {
    id: 'proj-mediheal-2026',
    title: 'MEDIHEAL "Always Heals You" Food Truck & Smoothie Bar',
    actor: 'duo',
    supportType: 'food_truck',
    status: 'open',
    eventName: 'MEDIHEAL Always Heals You with Jimmy-Sea',
    eventDate: '2026-12-06',
    location: 'Siam Square Block I, Bangkok',
    organizerName: 'JimmySea Thailand Union & Inter NomNoms',
    organizerContactUrl: 'https://x.com/JimmySeaTH',
    description: 'รถฟู้ดทรัค Avocean Wellness บริการสมูทตี้อโวคาโดสด ข้าวเหนียวมะม่วง และพุดดิ้งมะพร้าวอ่อน สำหรับศิลปิน ทีมงาน และแฟนคลับผู้โชคดี ณ สยามสแควร์',
    translatedDescription: 'Sending a custom-wrapped "Avocean Wellness" food truck offering fresh avocado smoothies, mango sticky rice, and chilled coconut puddings for Jimmy, Sea, staff, and lucky fans at Siam Square Block I.',
    targetAmount: 45000,
    currentAmount: 38500,
    currency: 'THB',
    donationUrl: 'https://x.com/JimmySeaTH/status/1852000000000000000',
    announcementUrl: 'https://x.com/JimmySeaTH/status/1852000000000000000',
    deliveryNotes: 'ออกแบบสติ๊กเกอร์คัพสลีฟและป้ายแบ็กดร็อปเรียบร้อยแล้ว อยู่ระหว่างการผลิต',
    translatedDeliveryNotes: 'Cup sleeve stickers and photo backdrop banners are designed and now undergoing final printing for event day.',
    hashtags: '#MEDIHEALxJimmySea #JimmySea #AVOCEAN #จิมมี่ซี',
    proofMedia: [],
    createdAt: '2026-10-28T10:00:00.000Z'
  },
  {
    id: 'proj-gmmtv-next-2026',
    title: 'GMMTV2026 Press Conference: Custom Sea Salt Pastry & Energy Boost Coffee Cart',
    actor: 'duo',
    supportType: 'coffee_cart',
    status: 'reached',
    eventName: 'GMMTV 2026 UP & ABOVE PART 1',
    eventDate: '2026-11-25',
    location: 'Union Hall, 6F Union Mall, Bangkok',
    organizerName: 'JimmySea Philippines & Inter Fans Union',
    organizerContactUrl: 'https://x.com/JimmySeaPH',
    description: 'Fully sponsored specialty coffee bar and customized pastry boxes (with Jimmy & Sea signature logos) for the artists, managers, and press team during the 2026 series line-up announcement.',
    translatedDescription: 'Fully sponsored specialty coffee bar and customized pastry boxes (with Jimmy & Sea signature logos) for the artists, managers, and press team during the 2026 series line-up announcement.',
    targetAmount: 30000,
    currentAmount: 30000,
    currency: 'THB',
    donationUrl: 'https://x.com/JimmySeaPH',
    announcementUrl: 'https://x.com/JimmySeaPH',
    deliveryNotes: 'Goal 100% reached! Barista crew scheduled and artist snack boxes ordered.',
    translatedDeliveryNotes: 'Goal 100% reached! Barista crew scheduled and artist snack boxes ordered.',
    hashtags: '#GMMTV2026 #JimmySea #AVOCEAN #GMMTV',
    proofMedia: [
      {
        id: 'media-gmmtv-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1000&q=80',
        caption: 'Barista station banner mockup for GMMTV2026 Press Con'
      }
    ],
    createdAt: '2026-10-15T12:00:00.000Z'
  },
  {
    id: 'proj-jimmy-clinic-snack',
    title: 'Dr. Jimmy Clinic Day Refreshment & Snack Support',
    actor: 'jimmy',
    supportType: 'snack_boxes',
    status: 'delivered',
    eventName: 'Dr. Jimmy Clinic & Fan Greeting',
    eventDate: '2026-10-18',
    location: 'Bangkok, Thailand',
    organizerName: 'Tiny Worldwide & Tiny TH',
    organizerContactUrl: 'https://x.com/Jimmyyjp_TH',
    description: 'จัดส่งกล่องของว่างพรีเมียม 80 กล่อง พร้อมน้ำผลไม้ออร์แกนิกและการ์ดข้อความอวยพรธีมอโวคาโด มอบให้แก่คุณหมอจิมมี่และบุคลากรทางการแพทย์',
    translatedDescription: 'Successfully delivered 80 premium snack boxes with organic juices and customized avocado-themed thank you cards to the clinic medical staff and Dr. Jimmy.',
    targetAmount: 18000,
    currentAmount: 18000,
    currency: 'THB',
    announcementUrl: 'https://x.com/Jimmyyjp_TH',
    deliveryNotes: 'ส่งมอบขนมและกล่องของว่างทั้ง 80 กล่องเรียบร้อยแล้วตอน 11:30 น. คุณหมอจิมมี่และเจ้าหน้าที่ชอบมาก ขอบคุณแฟนคลับทุกคน!',
    translatedDeliveryNotes: 'All 80 snack boxes delivered safely at 11:30 AM before the clinic afternoon shift. Dr. Jimmy and staff loved the snacks. Thank you to all donors and Tinies!',
    proofMedia: [
      {
        id: 'proof-jimmy-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80',
        caption: 'Custom snack boxes delivered with personalized thank-you tags for Dr. Jimmy'
      },
      {
        id: 'proof-jimmy-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=80',
        caption: 'Freshly baked pastries & organic fruit juices handed to clinic staff'
      }
    ],
    createdAt: '2026-10-01T04:00:00.000Z'
  },
  {
    id: 'proj-sea-badminton-cup',
    title: 'Sea Tawinan Friendly Badminton Match Cheering & Energy Drink Station',
    actor: 'sea',
    supportType: 'coffee_cart',
    status: 'delivered',
    eventName: 'Sea Tawinan Celebrity Badminton Exhibition',
    eventDate: '2026-10-22',
    location: 'Bangkok Sports Complex',
    organizerName: 'Official Sea Tawinan Fanclub (ChaoTalay TH)',
    organizerContactUrl: 'https://x.com/Sea_tawinan_TH',
    description: 'จัดเครื่องดื่มเกลือแร่ ขนมโปรตีน และชาเขียวมัทฉะเย็น สนับสนุนน้องซี ทวินันท์ และทีมนักกีฬาในการแข่งขันแบดมินตันนัดพิเศษ',
    translatedDescription: 'Provided electrolyte drinks, protein snacks, and iced matcha lattes for Sea and his fellow players during the exhibition match.',
    targetAmount: 15000,
    currentAmount: 15000,
    currency: 'THB',
    announcementUrl: 'https://x.com/Sea_tawinan_TH',
    deliveryNotes: 'น้องซีชอบชาเขียวมัทฉะเย็นมาก ดื่มเติมพลังก่อนลงแข่ง ขอบคุณชาวทะเลทุกคนที่ร่วมส่งกำลังใจให้ซีครับ',
    translatedDeliveryNotes: 'Sea loved the iced matcha latte and drank it for an energy boost before stepping onto the court! Thank you ChaoTalay for your wonderful love and cheering.',
    proofMedia: [
      {
        id: 'proof-sea-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1000&q=80',
        caption: 'Energy drink bar set up with cheering banners at the badminton court'
      }
    ],
    createdAt: '2026-10-08T06:00:00.000Z'
  }
];

