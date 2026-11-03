import type { CareerProject } from '../types/projects';

export const INITIAL_CAREER_PROJECTS: CareerProject[] = [
  // ==========================================
  // 1. SHOWS & SERIES
  // ==========================================
  {
    id: 'proj-show-1',
    title: 'Last Twilight ภาพนายไม่เคยลืม',
    englishTitle: 'Last Twilight The Series',
    category: 'shows',
    artist: 'jimmysea',
    role: 'Jimmy as Mork, Sea as Day',
    jimmyRole: 'Mork (Mork Methas)',
    seaRole: 'Day (Day Wachirawit)',
    director: 'Aof Noppharnach Chaiwimol',
    year: 'Nov 2023 – Jan 2024',
    filmedPeriod: 'August – November 2023',
    status: 'released',
    description: 'Day, a rising national badminton athlete who suddenly suffers partial vision loss, hires Mork, a tough mechanic on probation, as his personal caretaker. Their profound journey explores vulnerability, companionship, self-worth, and love before the light fades completely. Directed by Aof Noppharnach.',
    highlight: '⭐ Asian Television Awards Nominee · Multi-Award Winning Masterpiece',
    platform: 'GMMTV / YouTube',
    primaryLink: 'https://www.youtube.com/playlist?list=PLszepnkojZI4uF7g9-iMvP6981o4Zl4R2',
    imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
    tags: ['#LastTwilightSeries', 'GMMTV', 'BL Masterpiece', 'MorkDay'],
    watchLinks: [
      { label: 'YouTube Official UNCUT Playlist', url: 'https://www.youtube.com/playlist?list=PLszepnkojZI4uF7g9-iMvP6981o4Zl4R2', platform: 'YouTube' },
      { label: 'GMMTV Official Page', url: 'https://www.gmm-tv.com', platform: 'GMMTV' },
      { label: 'Official Series X/Twitter', url: 'https://x.com/LastTwilightTH', platform: 'X' }
    ],
    extraLinks: [
      { label: 'Watch on YouTube', url: 'https://www.youtube.com/playlist?list=PLszepnkojZI4uF7g9-iMvP6981o4Zl4R2', platform: 'YouTube' }
    ]
  },
  {
    id: 'proj-show-2',
    title: 'Vice Versa รักสลับโลก',
    englishTitle: 'Vice Versa The Series',
    category: 'shows',
    artist: 'jimmysea',
    role: 'Jimmy as Tun / Puen, Sea as Talay / Tess',
    jimmyRole: 'Tun / Puen',
    seaRole: 'Talay / Tess',
    director: 'X Nuttapong Mongkolsawas',
    year: 'Jul 2022 – Oct 2022',
    filmedPeriod: 'February – June 2022',
    status: 'released',
    description: 'Talay wakes up in the body of Tess inside an alternate parallel universe. To find his "portkey" and return to his home world, he must find another soul who crossed over from the same universe, leading him to Puen (living in Tun\'s body). Directed by X Nuttapong.',
    highlight: '🥑🌊 Jimmy & Sea Iconic Debut BL Lead Pairing',
    platform: 'GMMTV / YouTube',
    primaryLink: 'https://www.youtube.com/playlist?list=PLszepnkojZI4xUj5k7rUoU8jLzSgWqgBq',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    tags: ['#ViceVersaSeries', 'GMMTV', 'Parallel Universe', 'PuenTalay'],
    watchLinks: [
      { label: 'YouTube Complete Series', url: 'https://www.youtube.com/playlist?list=PLszepnkojZI4xUj5k7rUoU8jLzSgWqgBq', platform: 'YouTube' },
      { label: 'GMMTV Official Page', url: 'https://www.gmm-tv.com', platform: 'GMMTV' }
    ],
    extraLinks: [
      { label: 'Watch Full Series', url: 'https://www.youtube.com/playlist?list=PLszepnkojZI4xUj5k7rUoU8jLzSgWqgBq', platform: 'YouTube' }
    ]
  },
  {
    id: 'proj-show-3',
    title: 'Our Skyy 2: Vice Versa',
    englishTitle: 'Our Skyy 2: Puen & Talay',
    category: 'shows',
    artist: 'jimmysea',
    role: 'Jimmy as Puen, Sea as Talay',
    jimmyRole: 'Puen',
    seaRole: 'Talay',
    director: 'X Nuttapong Mongkolsawas',
    year: 'May 2023',
    filmedPeriod: 'March – April 2023',
    status: 'released',
    description: 'Heartwarming special anthology sequel following Puen and Talay as they plan their intimate wedding ceremony, support each other\'s dreams, and cherish life together.',
    highlight: 'Wedding & Sequel Episodes',
    platform: 'GMMTV / YouTube',
    primaryLink: 'https://www.youtube.com/playlist?list=PLszepnkojZI46c4fQ8b1Xn1l3Gq2s7gE2',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    tags: ['#OurSkyy2xViceVersa', 'GMMTV', 'Anthology'],
    watchLinks: [
      { label: 'YouTube Anthology Episodes', url: 'https://www.youtube.com/playlist?list=PLszepnkojZI46c4fQ8b1Xn1l3Gq2s7gE2', platform: 'YouTube' }
    ]
  },
  {
    id: 'proj-show-4',
    title: 'Bad Buddy Series แค่เพื่อนครับเพื่อน',
    englishTitle: 'Bad Buddy The Series',
    category: 'shows',
    artist: 'jimmy',
    role: 'Jimmy as Wai',
    jimmyRole: 'Wai (Architecture / Rugby Best Friend)',
    director: 'Aof Noppharnach Chaiwimol',
    year: 'Oct 2021 – Jan 2022',
    filmedPeriod: 'June – October 2021',
    status: 'released',
    description: 'Jimmy Jitaraphol\'s breakthrough television drama acting debut. Playing Wai, an architecture student and rugby player whose fierce loyalty to Pran drives pivotal dramatic conflicts. Directed by Aof Noppharnach.',
    highlight: 'Jimmy Jitaraphol Drama Debut',
    platform: 'GMMTV / YouTube',
    primaryLink: 'https://www.youtube.com/playlist?list=PLszepnkojZI6xG6sK9hWkF6g9O7n0g1iJ',
    imageUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&auto=format&fit=crop&q=80',
    tags: ['#BadBuddySeries', 'GMMTV', 'Wai'],
    watchLinks: [
      { label: 'YouTube Full Episodes', url: 'https://www.youtube.com/playlist?list=PLszepnkojZI6xG6sK9hWkF6g9O7n0g1iJ', platform: 'YouTube' }
    ]
  },
  {
    id: 'proj-show-5',
    title: '55:15 Never Too Late',
    englishTitle: '55:15 Never Too Late',
    category: 'shows',
    artist: 'sea',
    role: 'Sea as Pangpond',
    seaRole: 'Pangpond (15-year-old Songwriter)',
    director: 'Koo Ekkasit Trakulkasemsuk',
    year: 'Dec 2021 – Feb 2022',
    filmedPeriod: 'July – November 2021',
    status: 'released',
    description: 'Sea Tawinan\'s television acting debut. Five adults at age 55 unexpectedly wake up back in their 15-year-old bodies, giving them a magical second chance to fulfill regrets, love sincerely, and pursue unfulfilled dreams.',
    highlight: 'Sea Tawinan Drama Debut',
    platform: 'GMMTV / Disney+ Hotstar',
    primaryLink: 'https://www.youtube.com/playlist?list=PLszepnkojZI5j3_7e-BqXjS3p0i7F2K0Z',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
    tags: ['#5515NeverTooLate', 'GMMTV', 'Pangpond'],
    watchLinks: [
      { label: 'YouTube Playlist', url: 'https://www.youtube.com/playlist?list=PLszepnkojZI5j3_7e-BqXjS3p0i7F2K0Z', platform: 'YouTube' },
      { label: 'Disney+ Hotstar', url: 'https://www.hotstar.com', platform: 'Disney+' }
    ]
  },
  {
    id: 'proj-show-6',
    title: 'Ploy\'s Yearbook หนังสือรุ่นพลอย',
    englishTitle: 'Ploy\'s Yearbook',
    category: 'shows',
    artist: 'jimmy',
    role: 'Jimmy as Mek',
    jimmyRole: 'Mek (Class President & Doctor)',
    year: 'Apr 2024 – Jun 2024',
    filmedPeriod: 'December 2023 – March 2024',
    status: 'released',
    description: 'Five girls all named Ploy reunite after 10 years when their high school yearbook resurfaces. Jimmy portrays Mek, exploring adult professional life, medical responsibilities, and enduring relationships.',
    platform: 'GMMTV / Viu',
    primaryLink: 'https://www.youtube.com/playlist?list=PLszepnkojZI5M6zW_1nI9pZ-Y1aJ3w3xL',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
    tags: ['#PloysYearbook', 'GMMTV', 'Mek'],
    watchLinks: [
      { label: 'YouTube Full Series', url: 'https://www.youtube.com/playlist?list=PLszepnkojZI5M6zW_1nI9pZ-Y1aJ3w3xL', platform: 'YouTube' }
    ]
  },
  {
    id: 'proj-show-7',
    title: 'Safe House Season 3: Best Bro Secret',
    englishTitle: 'GMMTV Safe House Season 3',
    category: 'shows',
    artist: 'jimmysea',
    role: 'Jimmy & Sea as Cast Residents',
    jimmyRole: 'Dr. Jimmy (Resident)',
    seaRole: 'Sea Tawinan (Resident)',
    year: 'Mar 2022',
    filmedPeriod: 'March 2022 (7 Days Live)',
    status: 'released',
    description: '7 days of 24/7 live reality streaming with GMMTV artists living together under one roof, participating in hilarious missions, cooking sessions, and heartfelt late-night talks.',
    highlight: '24/7 Live Reality Show',
    platform: 'GMMTV Live',
    primaryLink: 'https://www.youtube.com/@gmmtv',
    imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
    tags: ['#GMMTVSafeHouseSS3', 'RealityLive', 'JimmySea'],
    watchLinks: [
      { label: 'YouTube Safe House Archive', url: 'https://www.youtube.com/@gmmtv', platform: 'YouTube' }
    ]
  },
  {
    id: 'proj-show-8',
    title: 'Sweet Tooth, Good Dentist รักนี้ไม่มีฟันคุด',
    englishTitle: 'Sweet Tooth, Good Dentist',
    category: 'shows',
    artist: 'jimmysea',
    role: 'Jimmy as Pongpeun, Sea as Pepper',
    jimmyRole: 'Pongpeun',
    seaRole: 'Pepper',
    year: '2025–2026',
    filmedPeriod: 'Production 2025',
    status: 'upcoming',
    description: 'Upcoming romantic comedy adaptation following a gentle, dedicated dentist and a spirited patient through sweet, unexpected dental checkups and heartwarming relationship developments.',
    highlight: 'Upcoming Anticipated JimmySea Co-Lead Series',
    platform: 'GMMTV Announcement',
    primaryLink: 'https://x.com/GMMTV',
    imageUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&auto=format&fit=crop&q=80',
    tags: ['#SweetToothGoodDentist', 'GMMTVUpcoming', 'JimmySea'],
    watchLinks: [
      { label: 'Official GMMTV Announcement', url: 'https://x.com/GMMTV', platform: 'X' }
    ]
  },

  // ==========================================
  // 2. MOVIES & THEATRICAL SCREENINGS
  // ==========================================
  {
    id: 'proj-movie-1',
    title: 'Last Twilight Final EP Theatrical Premiere',
    englishTitle: 'Last Twilight: The Grand Cinema Finale',
    category: 'movies',
    artist: 'jimmysea',
    role: 'Jimmy & Sea with Cast and Director Aof',
    jimmyRole: 'Mork / Live Stage Performer',
    seaRole: 'Day / Live Stage Performer',
    year: 'Jan 2024',
    filmedPeriod: 'January 2024',
    status: 'released',
    description: 'Exclusive grand cinema screening of the Last Twilight finale across major theatre halls in Bangkok, featuring documentary footage, behind-the-scenes creation, and emotional live stage talks with thousands of fans.',
    highlight: 'Sold-Out Major Cineplex Theatrical Premiere',
    platform: 'Major Cineplex / GMMTV',
    primaryLink: 'https://x.com/LastTwilightTH',
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
    tags: ['#LastTwilightFinalEP', 'CinemaPremiere', 'Theatrical'],
    watchLinks: [
      { label: 'Official Cinema Recap & Photos', url: 'https://x.com/LastTwilightTH', platform: 'X' },
      { label: 'GMMTV Official Page', url: 'https://www.gmm-tv.com', platform: 'GMMTV' }
    ]
  },
  {
    id: 'proj-movie-2',
    title: 'Vice Versa The Final EP Live Screening',
    englishTitle: 'Vice Versa: Theatrical Fan Finale',
    category: 'movies',
    artist: 'jimmysea',
    role: 'Jimmy as Puen, Sea as Talay',
    jimmyRole: 'Puen / Stage Performer',
    seaRole: 'Talay / Stage Performer',
    year: 'Oct 2022',
    filmedPeriod: 'October 2022',
    status: 'released',
    description: 'Special cinema hall screening of the parallel universe finale episode with cast commentary, live musical showcases, and interactive fan celebration.',
    platform: 'Master Cineplex Siam Pavalai',
    primaryLink: 'https://x.com/GMMTV',
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80',
    tags: ['#ViceVersaFinalEP', 'CinemaScreening'],
    watchLinks: [
      { label: 'Siam Pavalai Premiere Recap', url: 'https://x.com/GMMTV', platform: 'X' }
    ]
  },

  // ==========================================
  // 3. MUSIC VIDEOS & SOUNDTRACKS
  // ==========================================
  {
    id: 'proj-mv-1',
    title: 'เป็นเธอใช่ไหม (The Key)',
    englishTitle: 'The Key — Jimmy & Sea',
    category: 'music_videos',
    artist: 'jimmysea',
    role: 'Duet by Jimmy Jitaraphol & Sea Tawinan',
    jimmyRole: 'Vocalist (Jimmy Jitaraphol)',
    seaRole: 'Vocalist (Sea Tawinan)',
    year: 'Jul 2022',
    filmedPeriod: 'May 2022',
    status: 'released',
    description: 'The iconic theme song for Vice Versa The Series. An uplifting pop ballad celebrating the destined connection that unlocks our hearts across any dimension.',
    highlight: 'Official Vice Versa Main Opening Theme Song',
    platform: 'GMMTV RECORDS / YouTube',
    primaryLink: 'https://www.youtube.com/watch?v=0kFh4zK-Q60',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    tags: ['#เป็นเธอใช่ไหม', '#ViceVersaOST', 'GMMTVRECORDS', 'Duet'],
    watchLinks: [
      { label: 'YouTube Official Music Video', url: 'https://www.youtube.com/watch?v=0kFh4zK-Q60', platform: 'YouTube' },
      { label: 'Spotify', url: 'https://open.spotify.com', platform: 'Spotify' },
      { label: 'Apple Music', url: 'https://music.apple.com', platform: 'Apple Music' }
    ]
  },
  {
    id: 'proj-mv-2',
    title: 'เพิ่งรู้ตัวว่ารักเธอ (Confess)',
    englishTitle: 'Confess — Sea Tawinan',
    category: 'music_videos',
    artist: 'sea',
    role: 'Solo Single by Sea Tawinan',
    seaRole: 'Solo Vocalist (Sea Tawinan)',
    year: 'Dec 2023',
    filmedPeriod: 'November 2023',
    status: 'released',
    description: 'Intimate acoustic single performed by Sea Tawinan for Last Twilight The Series, capturing Day\'s tender realization that Mork is the light guiding his heart.',
    highlight: 'Official Last Twilight OST · Sea Tawinan Solo',
    platform: 'GMMTV RECORDS / YouTube',
    primaryLink: 'https://www.youtube.com/watch?v=b4wH4K3H5s4',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    tags: ['#เพิ่งรู้ตัวว่ารักเธอ', '#LastTwilightOST', 'SeaTawinan', 'SoloOST'],
    watchLinks: [
      { label: 'YouTube Official Music Video', url: 'https://www.youtube.com/watch?v=b4wH4K3H5s4', platform: 'YouTube' },
      { label: 'Spotify', url: 'https://open.spotify.com', platform: 'Spotify' },
      { label: 'Apple Music', url: 'https://music.apple.com', platform: 'Apple Music' }
    ]
  },
  {
    id: 'proj-mv-3',
    title: 'ใครคลั่งรักกว่ากัน (Better Days)',
    englishTitle: 'Better Days — Jimmy Jitaraphol',
    category: 'music_videos',
    artist: 'jimmy',
    role: 'Solo Single by Jimmy Jitaraphol',
    jimmyRole: 'Solo Vocalist (Jimmy Jitaraphol)',
    year: 'Dec 2023',
    filmedPeriod: 'November 2023',
    status: 'released',
    description: 'Heart-melting romantic ballad sung by Jimmy Jitaraphol for Last Twilight The Series, expressing Mork\'s devotion to stay by Day\'s side through every dawn and twilight.',
    highlight: 'Official Last Twilight OST · Jimmy Jitaraphol Solo',
    platform: 'GMMTV RECORDS / YouTube',
    primaryLink: 'https://www.youtube.com/watch?v=e_wK7L4Z9r8',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    tags: ['#ใครคลั่งรักกว่ากัน', '#LastTwilightOST', 'JimmyJitaraphol', 'SoloOST'],
    watchLinks: [
      { label: 'YouTube Official Music Video', url: 'https://www.youtube.com/watch?v=e_wK7L4Z9r8', platform: 'YouTube' },
      { label: 'Spotify', url: 'https://open.spotify.com', platform: 'Spotify' },
      { label: 'Apple Music', url: 'https://music.apple.com', platform: 'Apple Music' }
    ]
  },
  {
    id: 'proj-mv-4',
    title: 'ไม่ไกลเกินก้าวเดิน (You\'ve Got My Back)',
    englishTitle: 'You\'ve Got My Back — Jimmy & Sea',
    category: 'music_videos',
    artist: 'jimmysea',
    role: 'Jimmy & Sea Duet',
    jimmyRole: 'Duet Vocalist (Jimmy)',
    seaRole: 'Duet Vocalist (Sea)',
    year: 'May 2023',
    filmedPeriod: 'April 2023',
    status: 'released',
    description: 'Energetic and inspiring acoustic-rock soundtrack for Our Skyy 2, emphasizing loyalty, partnership, and facing life\'s journeys side by side.',
    platform: 'GMMTV RECORDS / YouTube',
    primaryLink: 'https://www.youtube.com/@gmmtvrecords',
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
    tags: ['#OurSkyy2OST', 'GMMTVRECORDS', 'JimmySea'],
    watchLinks: [
      { label: 'YouTube Official Music Video', url: 'https://www.youtube.com/@gmmtvrecords', platform: 'YouTube' },
      { label: 'Spotify', url: 'https://open.spotify.com', platform: 'Spotify' }
    ]
  },

  // ==========================================
  // 4. OWNED BRANDS (PERSONAL BUSINESSES)
  // ==========================================
  {
    id: 'proj-owned-1',
    title: 'Doctor Jimmy Clinic คลินิกเวชกรรม',
    englishTitle: 'Doctor Jimmy Medical & Aesthetic Clinic',
    category: 'owned_brands',
    artist: 'jimmy',
    role: 'Dr. Jimmy Jitaraphol (Founder & Licensed Dermatologist)',
    jimmyRole: 'Founder & Head Physician',
    year: '2023–Present',
    filmedPeriod: 'Established 2023 (Bangkok)',
    status: 'active',
    description: 'Dr. Jimmy\'s premier medical aesthetic and dermatology clinic in Bangkok. Certified medical consultations, advanced skin health rejuvenation, acne management, and bespoke anti-aging procedures led by Dr. Jimmy himself.',
    highlight: '🩺 Board-Licensed Physician & Medical Aesthetic Specialist',
    platform: 'Bangkok Clinic & Instagram @dr.jimmy_clinic',
    primaryLink: 'https://instagram.com/dr.jimmy_clinic',
    imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80',
    tags: ['#DoctorJimmyClinic', 'Dermatology', 'MedicalClinic', 'Bangkok'],
    watchLinks: [
      { label: 'Official Clinic Instagram', url: 'https://instagram.com/dr.jimmy_clinic', platform: 'Instagram' },
      { label: 'Dr. Jimmy Personal IG', url: 'https://instagram.com/jimmyyjp', platform: 'Instagram' },
      { label: 'Line Official Booking', url: 'https://line.me', platform: 'Website' }
    ],
    extraLinks: [
      { label: 'Official Instagram', url: 'https://instagram.com/dr.jimmy_clinic', platform: 'Instagram' }
    ]
  },
  {
    id: 'proj-owned-2',
    title: 'Sunbather Studio & Sea Tawinan Apparel',
    englishTitle: 'Sunbather Studio / Sea Tawinan Lifestyle',
    category: 'owned_brands',
    artist: 'sea',
    role: 'Sea Tawinan (Founder & Creative Director)',
    seaRole: 'Founder & Creative Director',
    year: '2023–Present',
    filmedPeriod: 'Established 2023',
    status: 'active',
    description: 'Sea Tawinan\'s creative fashion and casual lifestyle brand, reflecting coastal calm, timeless minimal aesthetics, oversized comfortable tees, and sun-soaked relaxation.',
    highlight: '🌊 Sea Tawinan Creative Fashion & Lifestyle Brand',
    platform: 'Instagram @sea_tawinan',
    primaryLink: 'https://instagram.com/sea_tawinan',
    imageUrl: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=800&auto=format&fit=crop&q=80',
    tags: ['#SeaTawinan', 'LifestyleBrand', 'Fashion', 'ChaoTalay'],
    watchLinks: [
      { label: 'Sea Tawinan Instagram', url: 'https://instagram.com/sea_tawinan', platform: 'Instagram' },
      { label: 'Line Shopping Official Store', url: 'https://shop.line.me', platform: 'Shop' }
    ],
    extraLinks: [
      { label: 'Sea Tawinan Instagram', url: 'https://instagram.com/sea_tawinan', platform: 'Instagram' }
    ]
  },
  {
    id: 'proj-owned-3',
    title: 'Official AVOCEAN Signature Merch Line',
    englishTitle: 'AVOCEAN Collection & Signature Mascots',
    category: 'owned_brands',
    artist: 'avocean',
    role: 'Official Jimmy & Sea Signature Line',
    jimmyRole: 'Co-creator / Ambassador',
    seaRole: 'Co-creator / Ambassador',
    year: '2022–Present',
    status: 'active',
    description: 'Official designer apparel, signature avocado & ocean plush dolls, acrylic keyrings, and fan merchandise developed in partnership with GMMTV Shop.',
    highlight: '🥑💚 Official Fandom Mascot & Merch Line',
    platform: 'GMMTV Official Shop',
    primaryLink: 'https://www.gmm-tv.com/shop/',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80',
    tags: ['#AVOCEAN', 'GMMTVShop', 'OfficialMerch', 'JimmySea'],
    watchLinks: [
      { label: 'GMMTV Official Shop Collection', url: 'https://www.gmm-tv.com/shop/', platform: 'GMMTV' }
    ]
  },

  // ==========================================
  // 5. PARTNER BRANDS (COMMERCIAL ENDORSEMENTS)
  // ==========================================
  {
    id: 'proj-partner-1',
    title: 'Maybelline New York (Thailand)',
    englishTitle: 'Maybelline New York Brand Presenters',
    category: 'partner_brands',
    artist: 'jimmysea',
    role: 'Brand Presenters & Campaign Stars',
    jimmyRole: 'Brand Presenter',
    seaRole: 'Brand Presenter',
    year: '2023–Present',
    filmedPeriod: 'Campaigns 2023–2024',
    status: 'active',
    description: 'High-energy nationwide campaigns and fan activations featuring Maybelline SuperStay Matte Ink, SuperStay Teddy Tint, and long-wear beauty innovations.',
    highlight: 'Major International Cosmetics Campaign Presenters',
    platform: 'Maybelline Thailand',
    primaryLink: 'https://x.com/Maybelline_TH',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
    tags: ['#MaybellinexJimmySea', 'SuperStayTeddyTint', 'BrandAmbassador'],
    watchLinks: [
      { label: 'Maybelline Thailand Official X', url: 'https://x.com/Maybelline_TH', platform: 'X' },
      { label: 'Campaign Commercial on YouTube', url: 'https://www.youtube.com', platform: 'YouTube' }
    ]
  },
  {
    id: 'proj-partner-2',
    title: 'Cetaphil Thailand (เซตาฟิล)',
    englishTitle: 'Cetaphil Gentle Skin Cleanser Spokesperson',
    category: 'partner_brands',
    artist: 'jimmy',
    role: 'Brand Presenter & Medical Expert Spokesperson',
    jimmyRole: 'Brand Presenter & Physician Spokesperson',
    year: '2023–Present',
    filmedPeriod: 'Campaigns 2023–2024',
    status: 'active',
    description: 'Medical and daily skincare awareness campaigns highlighting dermatologist-recommended Gentle Skin Cleanser for sensitive skin health.',
    highlight: 'Dermatologist-Endorsed Skincare Partnership',
    platform: 'Cetaphil Thailand',
    primaryLink: 'https://www.cetaphil.co.th/',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
    tags: ['#CetaphilxJimmy', 'Dermatologist', 'Skincare'],
    watchLinks: [
      { label: 'Cetaphil Thailand Official Site', url: 'https://www.cetaphil.co.th/', platform: 'Website' }
    ]
  },
  {
    id: 'proj-partner-3',
    title: 'CeraVe Thailand',
    englishTitle: 'CeraVe Skin Barrier Campaign',
    category: 'partner_brands',
    artist: 'jimmysea',
    role: 'Brand Presenters',
    jimmyRole: 'Brand Presenter',
    seaRole: 'Brand Presenter',
    year: '2023–Present',
    filmedPeriod: 'Campaigns 2023–2024',
    status: 'active',
    description: 'National skin barrier restoration campaigns demonstrating essential 3-ceramide technology, daily moisturizers, and foam cleansers.',
    platform: 'CeraVe Thailand',
    primaryLink: 'https://www.cerave.co.th/',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=80',
    tags: ['#CeraVexJimmySea', 'SkinBarrier', 'Hydration'],
    watchLinks: [
      { label: 'CeraVe Official Campaign Site', url: 'https://www.cerave.co.th/', platform: 'Website' }
    ]
  },
  {
    id: 'proj-partner-4',
    title: 'Lactasoy (แลคตาซอย)',
    englishTitle: 'Lactasoy High Protein Soy Milk',
    category: 'partner_brands',
    artist: 'jimmysea',
    role: 'Brand Ambassadors & TV Commercial Stars',
    jimmyRole: 'TV Commercial Lead & Ambassador',
    seaRole: 'TV Commercial Lead & Ambassador',
    year: '2023–2024',
    filmedPeriod: 'TVC Filmed late 2023',
    status: 'active',
    description: 'High-profile nationwide television commercials, billboard takeovers across Bangkok, and university roadshows promoting delicious soy protein.',
    highlight: 'Nationwide TV Commercial & Billboard Campaign',
    platform: 'Lactasoy Thailand',
    primaryLink: 'https://x.com/LactasoyClub',
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
    tags: ['#LactasoyxJimmySea', 'TVC', 'BrandAmbassador'],
    watchLinks: [
      { label: 'Lactasoy Thailand Official X', url: 'https://x.com/LactasoyClub', platform: 'X' },
      { label: 'Official TV Commercial', url: 'https://www.youtube.com', platform: 'YouTube' }
    ]
  },
  {
    id: 'proj-partner-5',
    title: 'Glico Pocky Thailand',
    englishTitle: 'Glico Pocky & Pretz Brand Presenters',
    category: 'partner_brands',
    artist: 'jimmysea',
    role: 'Campaign Presenters & Fan Meet Hosts',
    jimmyRole: 'Campaign Presenter',
    seaRole: 'Campaign Presenter',
    year: '2023–2024',
    filmedPeriod: 'Fan Meet & Campaign 2023',
    status: 'active',
    description: 'Joyful snack campaigns bringing happiness and sharing crisp sweetness through exclusive meet-and-greets and social challenges.',
    platform: 'Glico Thailand',
    primaryLink: 'https://x.com/Glico_TH',
    imageUrl: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&auto=format&fit=crop&q=80',
    tags: ['#PockyxJimmySea', 'GlicoPocky', 'Snacks'],
    watchLinks: [
      { label: 'Glico Thailand Official Page', url: 'https://x.com/Glico_TH', platform: 'X' }
    ]
  },
  {
    id: 'proj-partner-6',
    title: 'Skechers Thailand',
    englishTitle: 'Skechers Athleisure & Streetwear Presenters',
    category: 'partner_brands',
    artist: 'jimmysea',
    role: 'Brand Presenters',
    jimmyRole: 'Brand Presenter',
    seaRole: 'Brand Presenter',
    year: '2023–2024',
    filmedPeriod: 'Campaigns 2023–2024',
    status: 'active',
    description: 'Trendy streetwear sneaker showcases, air-cooled memory foam footwear campaigns, and active lifestyle fashion collections.',
    platform: 'Skechers Thailand',
    primaryLink: 'https://www.skechers.co.th/',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    tags: ['#SkechersxJimmySea', 'Streetwear', 'Sneakers'],
    watchLinks: [
      { label: 'Skechers Thailand Official Site', url: 'https://www.skechers.co.th/', platform: 'Website' }
    ]
  },
  {
    id: 'proj-partner-7',
    title: 'Kiehl\'s Since 1851 (Thailand)',
    englishTitle: 'Kiehl\'s Apothecary Skincare Partner',
    category: 'partner_brands',
    artist: 'sea',
    role: 'Campaign Presenter',
    seaRole: 'Campaign Presenter',
    year: '2023–Present',
    filmedPeriod: 'Campaigns 2023–2024',
    status: 'active',
    description: 'Apothecary botanical skincare features, Calendula herbal extract toner campaigns, and eco-friendly skin rejuvenation.',
    platform: 'Kiehl\'s Thailand',
    primaryLink: 'https://www.kiehls.co.th/',
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-21695e54d19d?w=800&auto=format&fit=crop&q=80',
    tags: ['#KiehlsxSea', 'BotanicalSkincare', 'SeaTawinan'],
    watchLinks: [
      { label: 'Kiehl\'s Thailand Official Store', url: 'https://www.kiehls.co.th/', platform: 'Website' }
    ]
  },
  {
    id: 'proj-partner-8',
    title: 'L\'Oréal Paris Thailand',
    englishTitle: 'L\'Oréal Paris Expert Beauty Presenters',
    category: 'partner_brands',
    artist: 'jimmysea',
    role: 'Runway Presenters & Skin Expert Series',
    jimmyRole: 'Runway Presenter',
    seaRole: 'Runway Presenter',
    year: '2024',
    filmedPeriod: 'Paris Runway & BKK Launch 2024',
    status: 'active',
    description: 'Runway showcases, Glycolic-Bright serum launches, and live beauty panels exploring dermatologist science and radiant skin.',
    platform: 'L\'Oréal Paris Thailand',
    primaryLink: 'https://www.lorealparis.co.th/',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
    tags: ['#LorealxJimmySea', 'GlycolicBright', 'Beauty'],
    watchLinks: [
      { label: 'L\'Oréal Paris Official Site', url: 'https://www.lorealparis.co.th/', platform: 'Website' }
    ]
  }
];
