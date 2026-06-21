import type { Metadata } from 'next';
import CostManager from '../../components/CostManager';

export const metadata: Metadata = { title: 'খরচের হিসাব — সাজেক' };

export default function CostPage() {
  return <CostManager />;
}
