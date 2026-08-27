export type Language = 'EN' | 'FR';

export const translations: Record<
  Language,
  {
    header: {
      nav: { home: string; courses: string; tcfTef: string; pricing: string; blog: string; about: string };
      signIn: string;
      getStarted: string;
    };
    footer: {
      tagline: string;
      quickLinksHeading: string;
      quickLinks: { about: string; community: string; terms: string; privacy: string };
      contactHeading: string;
      email: string;
      canadaContact: string;
      nigeriaContact: string;
      newsletterHeading: string;
      newsletterDescription: string;
      emailPlaceholder: string;
      newsletterInputLabel: string;
      newsletterSubmit: string;
      newsletterSuccess: string;
      newsletterAlreadySubscribed: string;
      newsletterError: string;
      rightsReserved: string;
    };
    hero: {
      title: string;
      subtitle: string;
      getStarted: string;
      exploreCourses: string;
      communityTagline: string;
      tracks: string;
      examConfidence: string;
      imageAlt: string;
    };
    featureBlocks: {
      heading: string;
      subheading: string;
      features: { title: string; description: string }[];
    };
    testimonials: {
      heading: string;
      subheading: string;
      quotes: string[];
    };
    pricingSection: {
      heading: string;
      subheading: string;
      mostPopular: string;
      choosePlan: string;
      tiers: {
        id: 'tcfTefBeginner' | 'tcfTefExamPrep' | 'delfDalfBeginner' | 'delfDalfExamPrep';
        name: string;
        price: string;
        period: string;
        description: string;
        features: string[];
      }[];
    };
  }
> = {
  EN: {
    header: {
      nav: {
        home: 'Home',
        courses: 'Courses',
        tcfTef: 'Exam Prep',
        pricing: 'Pricing',
        blog: 'Blog',
        about: 'About',
      },
      signIn: 'Sign In',
      getStarted: 'Get Started',
    },
    footer: {
      tagline: 'International Center for Language Proficiency - Your path to French fluency and exam success.',
      quickLinksHeading: 'Quick Links',
      quickLinks: {
        about: 'About',
        community: 'Community',
        terms: 'Terms of Service',
        privacy: 'Privacy Policy',
      },
      contactHeading: 'Contact',
      email: 'Email: centerforlanguageproficiency@gmail.com',
      canadaContact: 'Canada: +1 (437) 291-8783 (Phone & WhatsApp)',
      nigeriaContact: 'Nigeria: +234 813 040 8788 (Phone & WhatsApp)',
      newsletterHeading: 'Newsletter',
      newsletterDescription: 'Subscribe to get updates on new courses and features.',
      emailPlaceholder: 'Enter your email',
      newsletterInputLabel: 'Subscribe to newsletter',
      newsletterSubmit: 'Subscribe',
      newsletterSuccess: "You're on the list!",
      newsletterAlreadySubscribed: "You're already subscribed.",
      newsletterError: 'Something went wrong. Please try again.',
      rightsReserved: 'All rights reserved.',
    },
    hero: {
      title: 'Master French. Ace TCF, TEF, DELF & DALF.',
      subtitle:
        "From your first bonjour to exam day — start the beginner-to-fluent track, or jump straight into focused exam prep for TCF, TEF, DELF, or DALF.",
      getStarted: 'Get Started',
      exploreCourses: 'Explore Courses',
      communityTagline: 'A growing community of language learners',
      tracks: 'Learning Tracks',
      examConfidence: 'Helping learners prepare for TCF, TEF, DELF & DALF with confidence',
      imageAlt: 'Adults learning French online on laptops and tablets, preparing for the TCF, TEF, DELF, and DALF exams',
    },
    featureBlocks: {
      heading: 'Everything You Need to Pass Your French Exam',
      subheading:
        'Our platform gives you the tools and support to master French and walk into exam day ready — whichever exam and track you\'re on.',
      features: [
        {
          title: 'Interactive French Lessons',
          description:
            'Engaging video tutorials, downloadable PDFs, and interactive quizzes to reinforce your French at every step.',
        },
        {
          title: 'Live Tutors & Mock Exams',
          description:
            'Connect with native French speakers and certified tutors. Practice with real TCF, TEF, DELF & DALF exam simulations to build confidence.',
        },
        {
          title: 'Progress Tracking & Certificates',
          description:
            'Monitor your improvement with detailed analytics and earn certificates recognized for immigration, study, and work applications.',
        },
      ],
    },
    testimonials: {
      heading: 'What Our Students Say',
      subheading: 'Join thousands of learners who reached their French exam goals with ICLP.',
      quotes: [
        'ICLP helped me pass my TCF exam with flying colors! The interactive lessons and mock exams were exactly what I needed.',
        "The tutors are amazing and the platform is so easy to use. I've learned more in 3 months than I did in a year of traditional classes.",
        'Fantastic platform! The progress tracking keeps me motivated and the certificates are recognized by employers worldwide.',
      ],
    },
    pricingSection: {
      heading: 'Choose Your Learning Path',
      subheading: "Pricing built around your French track — from complete beginner to fast-tracking TCF, TEF, DELF, or DALF.",
      mostPopular: 'Most Popular',
      choosePlan: 'Choose Plan',
      tiers: [
        {
          id: 'tcfTefBeginner',
          name: 'Beginner to TCF/TEF',
          price: '$800',
          period: '/9 months',
          description: 'Full French course from A0, culminating in TCF/TEF exam prep',
          features: [
            'Complete French course, A0 to exam-ready',
            'All video lessons, PDFs & quizzes',
            'Live tutor sessions (4/month)',
            'Mock exams & practice tests included',
            'Progress tracking & analytics',
            'Certificate upon completion',
            'Priority support',
          ],
        },
        {
          id: 'tcfTefExamPrep',
          name: 'TCF/TEF Exam Prep Only',
          price: '$300',
          period: '/8 weeks',
          description: 'Already speak French? Fast-track your TCF/TEF exam prep',
          features: [
            'Unlimited mock exams & practice tests',
            'Scoring analysis & personalized recommendations',
            'Timed practice sections',
            'Live tutor sessions (2/month)',
            'Progress tracking',
            'Certificate upon completion',
          ],
        },
        {
          id: 'delfDalfBeginner',
          name: 'Beginner to DELF/DALF',
          price: '$800',
          period: '/9 months',
          description: 'Full French course from A1, culminating in DELF/DALF exam prep',
          features: [
            'Complete French course, A1 to your target DELF/DALF level',
            'All video lessons, PDFs & quizzes',
            'Live tutor sessions (4/month)',
            'Mock exams & practice tests included',
            'Progress tracking & analytics',
            'Certificate upon completion',
            'Priority support',
          ],
        },
        {
          id: 'delfDalfExamPrep',
          name: 'DELF/DALF Exam Prep Only',
          price: '$300',
          period: '/8 weeks',
          description: 'Already speak French? Fast-track your DELF or DALF exam prep',
          features: [
            'Unlimited mock exams & practice tests',
            'Scoring analysis & personalized recommendations',
            'Timed practice sections',
            'Live tutor sessions (2/month)',
            'Progress tracking',
            'Certificate upon completion',
          ],
        },
      ],
    },
  },
  FR: {
    header: {
      nav: {
        home: 'Accueil',
        courses: 'Cours',
        tcfTef: 'Préparation aux examens',
        pricing: 'Tarifs',
        blog: 'Blog',
        about: 'À propos',
      },
      signIn: 'Se connecter',
      getStarted: 'Commencer',
    },
    footer: {
      tagline:
        'Centre International de Compétence Linguistique - Votre chemin vers le français et la réussite aux examens.',
      quickLinksHeading: 'Liens Rapides',
      quickLinks: {
        about: 'À propos',
        community: 'Communauté',
        terms: "Conditions d'utilisation",
        privacy: 'Politique de confidentialité',
      },
      contactHeading: 'Contact',
      email: 'E-mail : centerforlanguageproficiency@gmail.com',
      canadaContact: 'Canada : +1 (437) 291-8783 (téléphone et WhatsApp)',
      nigeriaContact: 'Nigéria : +234 813 040 8788 (téléphone et WhatsApp)',
      newsletterHeading: 'Newsletter',
      newsletterDescription:
        'Abonnez-vous pour recevoir des mises à jour sur les nouveaux cours et fonctionnalités.',
      emailPlaceholder: 'Entrez votre e-mail',
      newsletterInputLabel: "S'abonner à la newsletter",
      newsletterSubmit: "S'abonner",
      newsletterSuccess: 'Inscription réussie !',
      newsletterAlreadySubscribed: 'Vous êtes déjà abonné(e).',
      newsletterError: "Une erreur s'est produite. Veuillez réessayer.",
      rightsReserved: 'Tous droits réservés.',
    },
    hero: {
      title: 'Maîtrisez le français. Réussissez le TCF, le TEF, le DELF ou le DALF.',
      subtitle:
        "De votre premier bonjour au jour de l'examen — suivez le parcours débutant à courant, ou passez directement à une préparation ciblée au TCF, au TEF, au DELF ou au DALF.",
      getStarted: 'Commencer',
      exploreCourses: 'Découvrir les cours',
      communityTagline: "Une communauté grandissante d'apprenants en langues",
      tracks: "Parcours d'apprentissage",
      examConfidence: 'Aider les apprenants à préparer le TCF, le TEF, le DELF et le DALF en toute confiance',
      imageAlt: 'Adultes apprenant le français en ligne sur ordinateurs portables et tablettes, en préparation aux examens TCF, TEF, DELF et DALF',
    },
    featureBlocks: {
      heading: "Tout ce qu'il faut pour réussir votre examen de français",
      subheading:
        "Notre plateforme vous donne les outils et le soutien nécessaires pour maîtriser le français et arriver prêt le jour de l'examen — quel que soit votre examen et votre parcours.",
      features: [
        {
          title: 'Leçons de français interactives',
          description:
            'Des tutoriels vidéo captivants, des PDF téléchargeables et des quiz interactifs pour renforcer votre français à chaque étape.',
        },
        {
          title: 'Tuteurs en direct et examens blancs',
          description:
            "Connectez-vous avec des locuteurs natifs et des tuteurs certifiés. Entraînez-vous avec de véritables simulations d'examen TCF, TEF, DELF et DALF pour gagner en confiance.",
        },
        {
          title: 'Suivi des progrès et certificats',
          description:
            "Suivez vos progrès grâce à des analyses détaillées et obtenez des certificats reconnus pour l'immigration, les études et le travail.",
        },
      ],
    },
    testimonials: {
      heading: 'Ce que disent nos étudiants',
      subheading: "Rejoignez des milliers d'apprenants qui ont atteint leurs objectifs d'examen de français grâce à ICLP.",
      quotes: [
        "ICLP m'a aidé à réussir mon examen TCF haut la main ! Les leçons interactives et les examens blancs étaient exactement ce dont j'avais besoin.",
        "Les tuteurs sont incroyables et la plateforme est si facile à utiliser. J'ai appris plus en 3 mois qu'en un an de cours traditionnels.",
        'Une plateforme fantastique ! Le suivi des progrès me garde motivé et les certificats sont reconnus par les employeurs du monde entier.',
      ],
    },
    pricingSection: {
      heading: "Choisissez votre parcours d'apprentissage",
      subheading:
        "Des tarifs pensés pour votre parcours en français — du débutant complet à une préparation accélérée au TCF, au TEF, au DELF ou au DALF.",
      mostPopular: 'Le plus populaire',
      choosePlan: 'Choisir ce forfait',
      tiers: [
        {
          id: 'tcfTefBeginner',
          name: 'Débutant vers le TCF/TEF',
          price: '800 $',
          period: '/9 mois',
          description: 'Cours complet de français dès le niveau A0, avec préparation au TCF/TEF à la fin',
          features: [
            'Cours de français complet, du A0 au niveau examen',
            'Toutes les leçons vidéo, PDF et quiz',
            'Séances avec tuteur en direct (4/mois)',
            "Examens blancs et tests d'entraînement inclus",
            'Suivi des progrès et analyses',
            'Certificat à la fin du cours',
            'Support prioritaire',
          ],
        },
        {
          id: 'tcfTefExamPrep',
          name: 'Préparation TCF/TEF seule',
          price: '300 $',
          period: '/8 semaines',
          description: 'Vous parlez déjà français ? Accélérez votre préparation au TCF/TEF',
          features: [
            'Examens blancs et tests d\'entraînement illimités',
            'Analyse des résultats et recommandations personnalisées',
            'Sections chronométrées',
            'Séances avec tuteur en direct (2/mois)',
            'Suivi des progrès',
            'Certificat à la fin du cours',
          ],
        },
        {
          id: 'delfDalfBeginner',
          name: 'Débutant vers le DELF/DALF',
          price: '800 $',
          period: '/9 mois',
          description: 'Cours complet de français dès le niveau A1, avec préparation au DELF/DALF à la fin',
          features: [
            'Cours de français complet, du A1 à votre niveau DELF/DALF cible',
            'Toutes les leçons vidéo, PDF et quiz',
            'Séances avec tuteur en direct (4/mois)',
            "Examens blancs et tests d'entraînement inclus",
            'Suivi des progrès et analyses',
            'Certificat à la fin du cours',
            'Support prioritaire',
          ],
        },
        {
          id: 'delfDalfExamPrep',
          name: 'Préparation DELF/DALF seule',
          price: '300 $',
          period: '/8 semaines',
          description: 'Vous parlez déjà français ? Accélérez votre préparation au DELF ou au DALF',
          features: [
            'Examens blancs et tests d\'entraînement illimités',
            'Analyse des résultats et recommandations personnalisées',
            'Sections chronométrées',
            'Séances avec tuteur en direct (2/mois)',
            'Suivi des progrès',
            'Certificat à la fin du cours',
          ],
        },
      ],
    },
  },
};
