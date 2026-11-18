// Copyright (c) 2026 Manjeet2684. All rights reserved.
// Fictional demo data authored for the YUGORA assignment. No real user data is used.
import "dotenv/config";
import { createPrismaClient } from "../src/infrastructure/database/prisma-client.js";
import { createPlaceholderProfilePhotoUrl } from "../src/shared/profile-placeholder-photo.js";

const prisma = createPrismaClient();
const demoUserId = process.env.DEMO_USER_ID?.trim() || "demo-user";

const profiles = [
  { slug: "riya", name: "Riya Mehta", age: 24, photo: 1, bio: "Designing little things that make everyday life feel special. Always up for a new café.", location: "South Delhi", interests: ["Design", "Coffee", "Photography", "Travel"] },
  { slug: "aarav", name: "Aarav Khanna", age: 26, photo: 12, bio: "Backend engineer on weekdays, amateur chef on weekends. I take my playlists seriously.", location: "Gurugram", interests: ["Cooking", "Music", "Running", "Technology"] },
  { slug: "ananya", name: "Ananya Rao", age: 23, photo: 5, bio: "Bookstore browser, sunset chaser, and enthusiastic planner of spontaneous trips.", location: "Bengaluru", interests: ["Reading", "Hiking", "Travel", "Art"] },
  { slug: "kabir", name: "Kabir Sethi", age: 27, photo: 14, bio: "Building products and collecting stories. I believe the best conversations start over chai.", location: "Noida", interests: ["Startups", "Cricket", "Coffee", "Cinema"] },
  { slug: "isha", name: "Isha Kapoor", age: 25, photo: 9, bio: "A curious mind with a camera roll full of architecture, dogs, and weekend escapes.", location: "Mumbai", interests: ["Photography", "Architecture", "Dogs", "Travel"] },
  { slug: "arjun", name: "Arjun Nair", age: 26, photo: 15, bio: "Product person, long-distance runner, and believer in doing the small things well.", location: "Pune", interests: ["Running", "Product", "Podcasts", "Food"] },
  { slug: "zoya", name: "Zoya Mirza", age: 24, photo: 20, bio: "Film camera in my bag, a book on my nightstand, and too many saved recipes.", location: "Hyderabad", interests: ["Cinema", "Reading", "Cooking", "Photography"] },
  { slug: "veer", name: "Veer Malhotra", age: 28, photo: 17, bio: "I like mountain air, clean code, and finding underrated places in a city.", location: "Chandigarh", interests: ["Trekking", "Technology", "Coffee", "Cycling"] },
  { slug: "meera", name: "Meera Iyer", age: 25, photo: 21, bio: "Classical music learner with a very modern obsession for street food.", location: "Chennai", interests: ["Music", "Food", "Dance", "Museums"] },
  { slug: "dev", name: "Dev Shah", age: 23, photo: 13, bio: "Quietly competitive at board games. Loudly enthusiastic about good design.", location: "Ahmedabad", interests: ["Board Games", "Design", "Football", "Coffee"] },
  { slug: "sara", name: "Sara Thomas", age: 26, photo: 24, bio: "Weekend swimmer, weekday researcher, and forever looking for the next great playlist.", location: "Kochi", interests: ["Swimming", "Music", "Science", "Beach Walks"] },
  { slug: "aditya", name: "Aditya Bose", age: 27, photo: 11, bio: "I make dashboards for work and terrible puns for free. Big fan of live gigs.", location: "Kolkata", interests: ["Live Music", "Football", "Data", "Books"] },
  { slug: "naina", name: "Naina Arora", age: 24, photo: 25, bio: "Trying new recipes, finding new trails, and learning to be less terrible at tennis.", location: "Jaipur", interests: ["Cooking", "Tennis", "Hiking", "Travel"] },
  { slug: "reyansh", name: "Reyansh Patel", age: 28, photo: 16, bio: "Architect by training, explorer by habit. I notice buildings before anything else.", location: "Indore", interests: ["Architecture", "History", "Cycling", "Photography"] },
  { slug: "tara", name: "Tara Sen", age: 22, photo: 26, bio: "Illustrator, playlist curator, and a person who will always stop to pet a dog.", location: "New Delhi", interests: ["Illustration", "Dogs", "Indie Music", "Art"] },
  { slug: "vihaan", name: "Vihaan Reddy", age: 25, photo: 18, bio: "Equal parts gym regular and dessert enthusiast. Looking for good company and better cafés.", location: "Hyderabad", interests: ["Fitness", "Desserts", "Coffee", "Movies"] },
  { slug: "diya", name: "Diya Menon", age: 26, photo: 27, bio: "Researcher who loves a good debate, a long walk, and a very strong filter coffee.", location: "Bengaluru", interests: ["Research", "Walking", "Books", "Coffee"] },
  { slug: "armaan", name: "Armaan Gill", age: 27, photo: 19, bio: "Weekend football, weekday spreadsheets. Always curious about how things work.", location: "Ludhiana", interests: ["Football", "Technology", "Road Trips", "Food"] },
  { slug: "kavya", name: "Kavya Desai", age: 23, photo: 28, bio: "A little bit of classical dance, a little bit of indie music, and lots of chai.", location: "Mumbai", interests: ["Dance", "Music", "Theatre", "Travel"] },
  { slug: "neil", name: "Neil D'Souza", age: 28, photo: 22, bio: "Ocean person living in a city. I spend weekends diving, cycling, or finding brunch.", location: "Goa", interests: ["Scuba Diving", "Cycling", "Brunch", "Beach"] },
  { slug: "sana", name: "Sana Qureshi", age: 25, photo: 29, bio: "Design systems by day, pottery by evening. Appreciates kindness and good typography.", location: "Noida", interests: ["Pottery", "Design", "Museums", "Yoga"] },
  { slug: "rohan", name: "Rohan Verma", age: 24, photo: 30, bio: "I enjoy early morning rides, old Hindi songs, and conversations without a clock.", location: "Lucknow", interests: ["Motorcycling", "Music", "History", "Food"] },
  { slug: "avni", name: "Avni Kulkarni", age: 26, photo: 31, bio: "Plant parent, amateur baker, and an optimist about public transport.", location: "Pune", interests: ["Gardening", "Baking", "Books", "Sustainability"] },
  { slug: "dhruv", name: "Dhruv Bhatia", age: 27, photo: 32, bio: "I build apps, play squash, and believe every city is best explored on foot.", location: "Gurugram", interests: ["Technology", "Squash", "Walking", "Travel"] },
  { slug: "mahika", name: "Mahika Jain", age: 22, photo: 33, bio: "Student of life and economics. Give me a museum, a market, or a long conversation.", location: "Bhopal", interests: ["Economics", "Museums", "Markets", "Reading"] },
  { slug: "yash", name: "Yash Chawla", age: 28, photo: 34, bio: "Into endurance sports, independent films, and making ambitious weekend plans.", location: "Delhi NCR", interests: ["Marathons", "Cinema", "Cycling", "Technology"] },
  { slug: "aisha", name: "Aisha Fernandes", age: 24, photo: 35, bio: "Trying to see more of the world, one local food recommendation at a time.", location: "Mangaluru", interests: ["Travel", "Food", "Languages", "Photography"] },
  { slug: "kunal", name: "Kunal Bansal", age: 26, photo: 36, bio: "A curious generalist: finance, basketball, sci-fi, and finding the best ramen.", location: "Gurugram", interests: ["Basketball", "Finance", "Sci-Fi", "Food"] },
  { slug: "mira", name: "Mira Chatterjee", age: 25, photo: 37, bio: "Writer, amateur pianist, and fan of the kind of rain that changes your plans.", location: "Kolkata", interests: ["Writing", "Piano", "Poetry", "Cinema"] },
  { slug: "vivaan", name: "Vivaan Rao", age: 27, photo: 38, bio: "Learning to make espresso, learning to slow down, and always up for a trail.", location: "Mysuru", interests: ["Coffee", "Trail Running", "Cooking", "Travel"] },
] as const;

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { id: demoUserId },
    update: {},
    create: { id: demoUserId },
  });

  for (const [index, profile] of profiles.entries()) {
    const ownerUserId = `yugora-user-${profile.slug}`;
    const profileId = `yugora-profile-${profile.slug}`;

    await prisma.user.upsert({ where: { id: ownerUserId }, update: {}, create: { id: ownerUserId } });
    await prisma.profile.upsert({
      where: { id: profileId },
      update: {
        ownerUserId,
        name: profile.name,
        age: profile.age,
        photoUrl: createPlaceholderProfilePhotoUrl(profile.name, profile.photo),
        bio: profile.bio,
        locationLabel: profile.location,
        isActive: true,
        displayOrder: index + 1,
      },
      create: {
        id: profileId,
        ownerUserId,
        name: profile.name,
        age: profile.age,
        photoUrl: createPlaceholderProfilePhotoUrl(profile.name, profile.photo),
        bio: profile.bio,
        locationLabel: profile.location,
        displayOrder: index + 1,
      },
    });

    // Rebuild only this seeded profile's tag links so rerunning the seed is deterministic.
    await prisma.profileInterest.deleteMany({ where: { profileId } });
    for (const [position, name] of profile.interests.entries()) {
      const interest = await prisma.interest.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      await prisma.profileInterest.create({
        data: { profileId, interestId: interest.id, position },
      });
    }
  }

  // Seed incoming interest as directed Swipe rows. These rows do not create
  // matches and are never exposed to the demo user by the feed projection.
  const incomingLikeIndexes = [0, 4, 8, 12, 16, 20, 24, 28];
  for (const index of incomingLikeIndexes) {
    const profile = profiles[index];
    if (!profile) continue;
    const actorUserId = `yugora-user-${profile.slug}`;
    await prisma.swipe.upsert({
      where: { actorUserId_targetUserId: { actorUserId, targetUserId: demoUserId } },
      update: {},
      create: { actorUserId, targetUserId: demoUserId, direction: "LIKE" },
    });
  }

  console.info(`YUGORA seed complete: ${profiles.length} profiles, ${incomingLikeIndexes.length} incoming demo likes, demo user '${demoUserId}'.`);
}

main()
  .catch((error: unknown) => {
    console.error("YUGORA seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
