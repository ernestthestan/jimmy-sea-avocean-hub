import type { FanClub, FoodSupportProject } from '../types/fanhub';

export const INITIAL_FAN_CLUBS: FanClub[] = [
  /* ============================================================== */
  /* EVERYONE (JIMMY + SEA + AVOCEAN FANDOM)                        */
  /* Triple Gradient: Purple, Blue, and Green                       */
  /* ============================================================== */
  {
    id: 'fc-avocean-official',
    name: 'Avocean Official Fandom Hub (Global)',
    actor: 'everyone',
    countryCode: 'GLOBAL',
    countryName: 'Worldwide / Inter',
    flagEmoji: '🌐',
    description: 'Official global hub uniting all Avoceans, NomNoms, Tinies, and ChaoTalays worldwide. Coordinated streaming schedules, birthday charity drives, and fan activities for Jimmy, Sea, and Avocean.',
    translatedDescription: 'Official global hub uniting all Avoceans, NomNoms, Tinies, and ChaoTalays worldwide. Coordinated streaming schedules, birthday charity drives, and fan activities for Jimmy, Sea, and Avocean.',
    handle: '@Avocean_Official',
    bannerUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isOfficialOrVerified: true,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/Avocean_Official' },
      { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/avocean_official' },
      { platform: 'tiktok', label: 'TikTok', url: 'https://tiktok.com/@avoceanofficial' },
      { platform: 'discord', label: 'Discord Server', url: 'https://discord.gg/avocean' }
    ]
  },
  {
    id: 'fc-avocean-th',
    name: 'Avocean Thailand (บ้านอโวเชี่ยน TH)',
    actor: 'everyone',
    countryCode: 'TH',
    countryName: 'Thailand',
    flagEmoji: '🇹🇭',
    description: 'บ้านหลักอโวเชี่ยนแห่งประเทศไทย ร่วมส่งกำลังใจให้จิมมี่-ซี และครอบครัวอโวเชี่ยน จัดกิจกรรมรถฟู้ดทรัค ป้ายบิลบอร์ด LED และกิจกรรมแฟนมีตติ้ง',
    translatedDescription: 'Main Thai home for the Avocean family. Cheering on Jimmy, Sea, and everyone in Avocean! Organizing food truck support, LED billboards, and local fan meetings.',
    handle: '@Avocean_TH',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    isOfficialOrVerified: true,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/Avocean_TH' },
      { platform: 'line', label: 'Line OpenChat', url: 'https://line.me/ti/g2/avoceanth' },
      { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/avocean_thailand' }
    ]
  },
  {
    id: 'fc-avocean-ph',
    name: 'Avocean Philippines Union (Avocean PH)',
    actor: 'everyone',
    countryCode: 'PH',
    countryName: 'Philippines',
    flagEmoji: '🇵🇭',
    description: 'All-in-one Philippine fanbase for Jimmy, Sea, and Avocean. Cup sleeve events, food support, live watch parties, and community outreach nationwide.',
    translatedDescription: 'All-in-one Philippine fanbase for Jimmy, Sea, and Avocean. Cup sleeve events, food support, live watch parties, and community outreach nationwide.',
    handle: '@AvoceanPH',
    bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    isOfficialOrVerified: true,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/AvoceanPH' },
      { platform: 'facebook', label: 'Facebook Page', url: 'https://facebook.com/AvoceanPhilippines' },
      { platform: 'discord', label: 'Discord Server', url: 'https://discord.gg/avoceanph' }
    ]
  },
  {
    id: 'fc-avocean-vn',
    name: 'Avocean Vietnam (Avocean VN Family)',
    actor: 'everyone',
    countryCode: 'VN',
    countryName: 'Vietnam',
    flagEmoji: '🇻🇳',
    description: 'Cộng đồng Avocean tại Việt Nam cùng ủng hộ Jimmy, Sea và toàn thể đại gia đình. Vietsub, tiếp ứng sự kiện, dự án thiện nguyện và order goods chính hãng.',
    translatedDescription: 'Avocean Vietnam community supporting Jimmy, Sea, and the entire family. Vietnamese subtitle releases, event support, charity projects, and official merchandise group orders.',
    handle: '@Avocean_VN',
    isOfficialOrVerified: false,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/Avocean_VN' },
      { platform: 'facebook', label: 'Facebook Community', url: 'https://facebook.com/AvoceanVietnam' }
    ]
  },
  {
    id: 'fc-avocean-jp',
    name: 'Avocean Japan (Avocean JP Fan Union)',
    actor: 'everyone',
    countryCode: 'JP',
    countryName: 'Japan',
    flagEmoji: '🇯🇵',
    description: 'ジミー、シー、アヴォシャンファミリーを応援する日本のファンコミュニティ。イベント情報、字幕翻訳、東京・大阪オフ会企画。',
    translatedDescription: 'Japanese fan community supporting Jimmy, Sea, and the Avocean family. Event updates, Japanese translations, and fan gather events in Tokyo and Osaka.',
    handle: '@Avocean_JP',
    isOfficialOrVerified: false,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/Avocean_JP' }
    ]
  },

  /* ============================================================== */
  /* DUO (JIMMYSEA)                                                 */
  /* Purple and Blue Gradient                                       */
  /* ============================================================== */
  {
    id: 'fc-js-official',
    name: 'JimmySea Official Fanclub (Inter)',
    actor: 'duo',
    countryCode: 'GLOBAL',
    countryName: 'Worldwide / Inter',
    flagEmoji: '🌐',
    description: 'Official international fanbase uniting NomNoms worldwide for Jimmy Jitaraphol & Sea Tawinan. Updates, trending schedules & project coordination.',
    translatedDescription: 'Official international fanbase uniting NomNoms worldwide for Jimmy Jitaraphol & Sea Tawinan. Updates, trending schedules & project coordination.',
    handle: '@JimmySea_OFC',
    isOfficialOrVerified: true,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/JimmySea_OFC' },
      { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/jimmysea_official' },
      { platform: 'tiktok', label: 'TikTok', url: 'https://tiktok.com/@jimmyseaofficial' },
      { platform: 'youtube', label: 'YouTube', url: 'https://youtube.com/@jimmysea_ofc' }
    ]
  },
  {
    id: 'fc-js-ph',
    name: 'JimmySea Philippines (NomNom PH)',
    actor: 'duo',
    countryCode: 'PH',
    countryName: 'Philippines',
    flagEmoji: '🇵🇭',
    description: 'Official Philippine chapter for Jimmy & Sea. Organizing cup sleeve events, food support, fan gathers, and streaming parties across Manila, Cebu, and Davao.',
    translatedDescription: 'Official Philippine chapter for Jimmy & Sea. Organizing cup sleeve events, food support, fan gathers, and streaming parties across Manila, Cebu, and Davao.',
    handle: '@JimmySeaPH',
    isOfficialOrVerified: true,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/JimmySeaPH' },
      { platform: 'facebook', label: 'Facebook Page', url: 'https://facebook.com/JimmySeaPhilippines' },
      { platform: 'discord', label: 'Discord Server', url: 'https://discord.gg/nomnomph' }
    ]
  },
  {
    id: 'fc-js-th',
    name: 'JimmySea Thailand Union',
    actor: 'duo',
    countryCode: 'TH',
    countryName: 'Thailand',
    flagEmoji: '🇹🇭',
    description: 'สหภาพแฟนคลับจิมมี่-ซีในประเทศไทย ประสานงานโปรเจกต์เชียร์สด ป้าย LED และรถอาหารฟู้ดทรัคทุกงานอีเวนต์',
    translatedDescription: 'JimmySea Thailand Fan Union. Coordinating on-site cheering, digital LED billboard campaigns, fanmeet registration guides, and food trucks for every event.',
    handle: '@JimmySeaTH',
    isOfficialOrVerified: true,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/JimmySeaTH' },
      { platform: 'line', label: 'Line OpenChat', url: 'https://line.me/ti/g2/jimmyseath' },
      { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/jimmysea_th' }
    ]
  },
  {
    id: 'fc-js-vn',
    name: 'JimmySea Vietnam (NomNoms VN)',
    actor: 'duo',
    countryCode: 'VN',
    countryName: 'Vietnam',
    flagEmoji: '🇻🇳',
    description: 'Cộng đồng người hâm mộ JimmySea tại Việt Nam. Cung cấp phụ đề tiếng Việt, quà tặng từ thiện và tiếp ứng concert.',
    translatedDescription: 'Vietnamese fan community for JimmySea. Vietnamese subtitle translations, charity drives, event support, and merchandise order groups.',
    handle: '@JimmySea_VN',
    isOfficialOrVerified: false,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/JimmySea_VN' },
      { platform: 'facebook', label: 'Facebook Community', url: 'https://facebook.com/JimmySeaVietnam' }
    ]
  },
  {
    id: 'fc-js-jp',
    name: 'JimmySea Japan Fan Union',
    actor: 'duo',
    countryCode: 'JP',
    countryName: 'Japan',
    flagEmoji: '🇯🇵',
    description: 'Jimmy＆Seaの日本公式応援ファンクラブ。公式告知の日本語訳、ファンミーティング案内、応援企画を実施。',
    translatedDescription: 'Japanese fan union for Jimmy & Sea. Translation of announcements, Tokyo fan gatherings, and Japanese event guidance.',
    handle: '@JimmySea_JP',
    isOfficialOrVerified: false,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/JimmySea_JP' }
    ]
  },
  {
    id: 'fc-js-cn',
    name: 'JimmySea China Bar (国内应援站)',
    actor: 'duo',
    countryCode: 'CN',
    countryName: 'China',
    flagEmoji: '🇨🇳',
    description: 'JimmySea大中华区联合应援站。专注官方日程、杂志代购、微博超话互动及大型演唱会花篮应援。',
    translatedDescription: 'Chinese fan base supporting JimmySea projects, magazine purchases, Weibo trending topics, and concert flower baskets.',
    handle: '@JimmySea_ChinaBar',
    isOfficialOrVerified: false,
    socials: [
      { platform: 'weibo', label: 'Weibo', url: 'https://weibo.com/jimmyseabar' },
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/JimmySea_ChinaBar' }
    ]
  },
  {
    id: 'fc-js-latam',
    name: 'JimmySea Latin America (NomNoms LatAm)',
    actor: 'duo',
    countryCode: 'LATAM',
    countryName: 'Latin America',
    flagEmoji: '🇲🇽',
    description: 'Comunidad hispanohablante y brasileña para Jimmy & Sea en México, Brasil, Colombia, Perú, Chile y Argentina.',
    translatedDescription: 'Spanish & Portuguese fan community for Jimmy & Sea across Mexico, Brazil, Colombia, Peru, Chile, and Argentina with event translations and support.',
    handle: '@JimmySeaLatAm',
    isOfficialOrVerified: false,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/JimmySeaLatAm' },
      { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/jimmysea_latam' }
    ]
  },

  /* ============================================================== */
  /* ACTOR (JIMMY JITARAPHOL & SEA TAWINAN SOLO)                    */
  /* Jimmy: Purple | Sea: Blue                                      */
  /* ============================================================== */
  {
    id: 'fc-jimmy-th',
    name: 'Official Jimmy Jitaraphol Fanclub (Tiny TH)',
    actor: 'jimmy',
    countryCode: 'TH',
    countryName: 'Thailand',
    flagEmoji: '🇹🇭',
    description: 'บ้านแฟนคลับทางการของคุณหมอจิมมี่ จิตรพล โพธิวิหค อัปเดตตารางงาน คลินิกผิวหนัง และโปรเจกต์วันเกิดการกุศล',
    translatedDescription: 'Official fanbase for Dr. Jimmy Jitaraphol Potiwihok. Schedule releases, dermatology clinic event updates, and charity birthday projects.',
    handle: '@Jimmyyjp_TH',
    isOfficialOrVerified: true,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/Jimmyyjp_TH' },
      { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/jimmyyjp_official' }
    ]
  },
  {
    id: 'fc-jimmy-ph',
    name: 'Jimmy Jitaraphol Philippines (Tiny PH)',
    actor: 'jimmy',
    countryCode: 'PH',
    countryName: 'Philippines',
    flagEmoji: '🇵🇭',
    description: 'Philippine fan base for Jimmy Jitaraphol. Dedicated support for Jimmy solo brands, medical community support & local outreach.',
    translatedDescription: 'Philippine fan base for Jimmy Jitaraphol. Dedicated support for Jimmy solo brands, medical community support & local outreach.',
    handle: '@JimmyyjpPH',
    isOfficialOrVerified: false,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/JimmyyjpPH' }
    ]
  },
  {
    id: 'fc-jimmy-global',
    name: 'Tiny Worldwide (Jimmy Global Fans)',
    actor: 'jimmy',
    countryCode: 'GLOBAL',
    countryName: 'Worldwide / Inter',
    flagEmoji: '🌐',
    description: 'Global fan collective celebrating Dr. Jimmy Jitaraphol. Translations, photo galleries, and international support campaigns.',
    translatedDescription: 'Global fan collective celebrating Dr. Jimmy Jitaraphol. Translations, photo galleries, and international support campaigns.',
    handle: '@JimmyyjpGlobal',
    isOfficialOrVerified: false,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/JimmyyjpGlobal' }
    ]
  },
  {
    id: 'fc-sea-th',
    name: 'Official Sea Tawinan Fanclub (ChaoTalay TH)',
    actor: 'sea',
    countryCode: 'TH',
    countryName: 'Thailand',
    flagEmoji: '🇹🇭',
    description: 'บ้านแฟนคลับทางการของซี ทวินันท์ อนุกูลประเสริฐ (ชาวทะเล) อัปเดตตารางออกอากาศ แข่งขันแบดมินตัน และอีเวนต์แบรนด์ชั้นนำ',
    translatedDescription: 'Official fanbase for Sea Tawinan Anukoolprasert (ชาวทะเล). Broadcast schedules, badminton matches, and brand pop-up schedules.',
    handle: '@Sea_tawinan_TH',
    isOfficialOrVerified: true,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/Sea_tawinan_TH' },
      { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/seatawinan_official' }
    ]
  },
  {
    id: 'fc-sea-ph',
    name: 'Sea Tawinan Philippines (ChaoTalay PH)',
    actor: 'sea',
    countryCode: 'PH',
    countryName: 'Philippines',
    flagEmoji: '🇵🇭',
    description: 'Philippine fan club for Sea Tawinan. Fashion updates, badminton cheering, and collaborative projects with SEA NomNoms.',
    translatedDescription: 'Philippine fan club for Sea Tawinan. Fashion updates, badminton cheering, and collaborative projects with SEA NomNoms.',
    handle: '@SeaTawinanPH',
    isOfficialOrVerified: false,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/SeaTawinanPH' }
    ]
  },
  {
    id: 'fc-sea-global',
    name: 'ChaoTalay Worldwide (Sea Global Fans)',
    actor: 'sea',
    countryCode: 'GLOBAL',
    countryName: 'Worldwide / Inter',
    flagEmoji: '🌐',
    description: 'International fan collective for Sea Tawinan. Translating Thai interviews, fashion archives, and supporting all Sea solo endeavors.',
    translatedDescription: 'International fan collective for Sea Tawinan. Translating Thai interviews, fashion archives, and supporting all Sea solo endeavors.',
    handle: '@SeaTawinanGlobal',
    isOfficialOrVerified: false,
    socials: [
      { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/SeaTawinanGlobal' }
    ]
  }
];

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

