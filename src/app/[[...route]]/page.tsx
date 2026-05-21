import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import ClientSpa from '../ClientSpa';

export default function SPAWildcardPage() {
  return <ClientSpa />;
}

// NextJS App Router parses this dynamically on the server side for crawlers, bot links, and messaging previews
interface PageProps {
  params: Promise<{ route?: string[] }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const route = params.route || [];

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  // Perfect, eye-catching SEO defaults for the platform launcher
  const defaultTitle = "ASVote - Secure Voting & Ticketing Platform";
  const defaultDesc = "ASVote is Ghana's primary trusted platform for secure real-time voting competitions and digital event ticketing.";
  const defaultImg = "https://ais-dev-uk6as2dpteu6zdpt3e6qs5-436170379829.europe-west1.run.app/og-image.png";

  if (route.length === 0) {
    return {
      title: defaultTitle,
      description: defaultDesc,
      openGraph: {
        title: defaultTitle,
        description: defaultDesc,
        images: [{ url: defaultImg }],
      },
    };
  }

  const primarySegment = route[0];

  switch (primarySegment) {
    case 'about':
      return {
        title: "About Us | ASVote",
        description: "Learn how ASVote is empowering digital transparency in pageants, reward schemes, and ticketing festivals.",
      };
    case 'events':
      return {
        title: "Browse Events & Voting Polls | ASVote",
        description: "Explore ongoing and upcoming ticketing events, pageants, and competitions in detail on ASVote.",
      };
    case 'contact':
      return {
        title: "Contact ASVote Support",
        description: "Need help setting up a poll or buying a ticket? Our support is online and ready.",
      };
    case 'help':
      return {
        title: "Help Center & FAQs | ASVote",
        description: "Find instant answers on voting rules, refund compliance, and verification steps.",
      };
    case 'privacy':
      return {
        title: "Privacy Hub & Safety | ASVote",
        description: "Read about our encrypted cookies, secure Paystack connections, and user safety standards.",
      };
    case 'terms':
      return {
        title: "Terms & Legal Conditions | ASVote",
        description: "Official legal terms regulating users, participants, and event organizers on ASVote.",
      };
    case 'event': {
      const eventId = route[1];
      if (eventId && supabaseUrl && supabaseAnonKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          const { data: event } = await supabase
            .from('events')
            .select('title, description, cover_image')
            .eq('id', eventId)
            .single();

          if (event) {
            const title = `${event.title} - Vote & Buy Tickets | ASVote`;
            const description = event.description || `Join and interact with ${event.title} on ASVote. Secure your votes and tickets instantly.`;
            const image = event.cover_image || defaultImg;
            return {
              title,
              description,
              openGraph: {
                title,
                description,
                images: [{ url: image }],
              },
              twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [image],
              }
            };
          }
        } catch (e) {
          console.error("SEO Metadata Fetch Error:", e);
        }
      }
      return {
        title: "Event Details | ASVote",
        description: "Discover event details, nominees list, voting metrics, and ticket purchasing.",
      };
    }
    default:
      return {
        title: defaultTitle,
        description: defaultDesc,
      };
  }
}
