import type { Metadata } from 'next';
import Gallery from '../../components/Gallery';

export const metadata: Metadata = { title: 'ছবি — সাজেক ট্যুর' };

export default function GalleryPage() {
  return <Gallery />;
}
