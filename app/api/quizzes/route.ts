import { NextResponse } from 'next/server';

type Q = { id: number; q: string; options: string[]; a: number };

const SAMPLE_QUIZZES: Record<string, Q[]> = {
  easy: [
    { id:1, q:'A fair coin is flipped repeatedly. What is the probability of getting two heads in a row before two tails in a row?', options:['1/2','1/3','2/3','3/4'], a:0 },
    { id:2, q:'You have 2 eggs and 100-floor building. What is the minimum worst-case drops required?', options:['10','14','20','7'], a:1 },
    { id:3, q:"Monty Hall: pick door 1, host opens door 3 revealing a goat. Should you switch to door 2?", options:['Yes','No','Doesn\'t matter','Only if host is random'], a:0 }
  ],
  medium: [
    { id:1, q:'Given 100 light bulbs toggled by divisors, how many remain ON?', options:['10','9','1','sqrt(100)'], a:3 },
    { id:2, q:'Expected number of trials to collect all coupons with n types?', options:['n','n log n','sqrt(n)','n^2'], a:1 }
  ],
  hard: [
    { id:1, q:'Probability of no fixed point in a random permutation tends to?', options:['1/e','0','1','1/2'], a:0 }
  ]
};

export async function GET() {
  return NextResponse.json({ success: true, data: SAMPLE_QUIZZES });
}


