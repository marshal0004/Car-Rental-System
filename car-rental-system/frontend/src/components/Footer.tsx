import Link from 'next/link';
import { Car, MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const QUICK_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/cars', label: 'Browse Cars' },
  { href: '/my-bookings', label: 'My Bookings' },
  { href: '/login', label: 'Login' },
];

const SOCIAL_LINKS = [
  { href: '#', label: 'Facebook', Icon: Facebook },
  { href: '#', label: 'Twitter', Icon: Twitter },
  { href: '#', label: 'Instagram', Icon: Instagram },
  { href: '#', label: 'LinkedIn', Icon: Linkedin },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-slate-900 text-slate-300">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 font-display text-xl font-bold text-white"
            >
              <Car className="h-6 w-6 text-brand-400" aria-hidden="true" />
              <span>ZoomWheels</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Drive Your Journey. India&apos;s friendly neighbourhood car rental —
              transparent pricing, clean cars, zero hidden charges.
            </p>
            <div className="mt-4 flex gap-3">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="rounded-md bg-slate-800 p-2 text-slate-300 transition-colors hover:bg-brand-600 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-brand-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Categories
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/cars?category=hatchback" className="text-sm text-slate-400 hover:text-brand-400">
                  Hatchbacks
                </Link>
              </li>
              <li>
                <Link href="/cars?category=sedan" className="text-sm text-slate-400 hover:text-brand-400">
                  Sedans
                </Link>
              </li>
              <li>
                <Link href="/cars?category=suv" className="text-sm text-slate-400 hover:text-brand-400">
                  SUVs
                </Link>
              </li>
              <li>
                <Link href="/cars?category=luxury" className="text-sm text-slate-400 hover:text-brand-400">
                  Luxury
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Contact Us
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-400" aria-hidden="true" />
                <span>42 MG Road, Bengaluru, Karnataka 560001</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-brand-400" aria-hidden="true" />
                <a href="tel:+918012345678" className="hover:text-brand-400">
                  +91 80123 45678
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-brand-400" aria-hidden="true" />
                <a href="mailto:hello@zoomwheels.in" className="hover:text-brand-400">
                  hello@zoomwheels.in
                </a>
              </li>
            </ul>
            <div className="mt-4 rounded-md bg-slate-800 px-3 py-2 text-xs text-slate-400">
              Open 24/7 — bookings accepted any time.
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} ZoomWheels Pvt. Ltd. All rights reserved.
            &middot; Prices are inclusive of all taxes.
          </p>
        </div>
      </div>
    </footer>
  );
}
