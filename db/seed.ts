import { db } from "./index";
import * as schema from "@shared/schema";
import bcrypt from "bcryptjs";

async function seed() {
  try {
    console.log("Starting seed process...");

    // Check if any users exist already
    const existingUsers = await db.query.users.findMany({
      limit: 1
    });
    
    if (existingUsers.length > 0) {
      console.log("Database already seeded. Skipping seed process.");
      return;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db.insert(schema.users).values({
      username: "admin",
      email: "admin@maresource.ai",
      password: adminPassword,
      role: "admin",
      subscriptionTier: "teams", // Give admin the highest tier
      messageCount: 0
    }).returning();
    
    console.log("Created admin user:", adminUser.username);

    // Create example users with different subscription tiers
    const userPassword = await bcrypt.hash("password123", 10);
    
    const [basicUser] = await db.insert(schema.users).values({
      username: "user1",
      email: "user1@example.com",
      password: userPassword,
      role: "user",
      subscriptionTier: "basic",
      messageCount: 12
    }).returning();
    
    const [researchUser] = await db.insert(schema.users).values({
      username: "scholar",
      email: "scholar@example.com",
      password: userPassword,
      role: "user",
      subscriptionTier: "research",
      messageCount: 45
    }).returning();
    
    const [freeUser] = await db.insert(schema.users).values({
      username: "guest",
      email: "guest@example.com",
      password: userPassword,
      role: "user",
      subscriptionTier: "free",
      messageCount: 38
    }).returning();

    console.log("Created example users");

    // Create example chat sessions
    const [ahkamChat] = await db.insert(schema.chatSessions).values({
      userId: basicUser.id,
      title: "Understanding Salah requirements",
      category: "ahkam"
    }).returning();
    
    const [sukoonChat] = await db.insert(schema.chatSessions).values({
      userId: basicUser.id,
      title: "Dealing with anxiety as a Muslim",
      category: "sukoon"
    }).returning();
    
    const [researchChat] = await db.insert(schema.chatSessions).values({
      userId: researchUser.id,
      title: "Research on early Islamic scholars",
      category: "research"
    }).returning();

    console.log("Created example chat sessions");

    // Add example messages to the Ahkam chat
    await db.insert(schema.messages).values([
      {
        chatId: ahkamChat.id,
        content: "As-Salaam-Alaykum. What can I help you find today?",
        sender: "ai"
      },
      {
        chatId: ahkamChat.id,
        content: "Can you tell me about the requirements for making my prayer valid? I sometimes have doubts about whether I'm performing it correctly.",
        sender: "user"
      },
      {
        chatId: ahkamChat.id,
        content: `Wa Alaikum Assalam. I'd be happy to explain the requirements for a valid prayer (Salah) according to Islamic teachings. Here are the key requirements:

### Prerequisites (Shurut):
1. Purification (Taharah): Being in a state of ritual purity through Wudu or Ghusl.
2. Covering the Awrah: Proper covering of specific parts of the body.
3. Facing the Qiblah: Directing oneself toward the Ka'bah in Makkah.
4. Entering the prayer time: Each of the five daily prayers has a specific time period.
5. Intention (Niyyah): Having a clear intention in your heart about which prayer you're performing.

### Essential Components (Arkan):
1. Takbir al-Ihram: Saying "Allahu Akbar" at the beginning of the prayer.
2. Standing (Qiyam): Standing upright if able.
3. Reciting Surah Al-Fatihah in each Rak'ah.
4. Bowing (Ruku): Bending forward with hands on knees.
5. Rising from Ruku: Returning to the standing position.
6. Prostration (Sujud): Placing forehead, nose, hands, knees, and toes on the ground.
7. Sitting between the two prostrations.
8. The final Tashahhud while sitting.
9. Saying the final Salam to conclude the prayer.

Would you like me to elaborate on any of these points or discuss common mistakes people make in their prayers?`,
        sender: "ai"
      }
    ]);

    // Add example messages to the Sukoon chat
    await db.insert(schema.messages).values([
      {
        chatId: sukoonChat.id,
        content: "As-Salaam-Alaykum. What can I help you find today? I'm here to provide Islamic-based guidance for emotional and mental wellbeing.",
        sender: "ai"
      },
      {
        chatId: sukoonChat.id,
        content: "I've been dealing with a lot of anxiety lately and it's affecting my prayer and daily life. Can you suggest any Islamic practices that might help?",
        sender: "user"
      },
      {
        chatId: sukoonChat.id,
        content: `Wa Alaikum Assalam, dear brother/sister. I'm sorry to hear you're experiencing anxiety. This is a common challenge that many Muslims face, and Islamic tradition offers several practices that can help provide relief and perspective.

### Islamic Practices for Anxiety Relief:

1. **Remembrance of Allah (Dhikr)**: The Quran states, "Verily, in the remembrance of Allah do hearts find rest" (13:28). Regular dhikr, such as repeating "SubhanAllah" (Glory be to Allah), "Alhamdulillah" (All praise is due to Allah), or "Astaghfirullah" (I seek forgiveness from Allah) can have a calming effect on the heart and mind.

2. **Salah with Mindfulness**: Try to perform your prayers with complete focus (khushu), concentrating on the meanings of what you're reciting and the physical movements. This acts as a form of mindfulness meditation.

3. **Dua for Anxiety**: The Prophet Muhammad ﷺ taught us specific supplications for anxiety:
   - "O Allah, I am Your servant, son of Your servant, son of Your maidservant, my forelock is in Your hand, Your command over me is forever executed and Your decree over me is just..." (Ahmad)
   - "There is no deity except You, Glory be to You, indeed I have been of the wrongdoers." (21:87)

4. **Recitation of Quran**: The Quran itself is a healing for the hearts. Surah Al-Rehman, Surah Yaseen, and the Mu'awwidhat (last three surahs) are particularly known for their calming properties.

5. **Physical Self-Care**: The Prophet ﷺ emphasized taking care of our physical health. Regular exercise, proper nutrition, and adequate sleep are all part of the Islamic lifestyle and can significantly reduce anxiety.

Would you like me to elaborate on any of these practices or suggest more specific routines you could incorporate into your daily life?`,
        sender: "ai"
      }
    ]);

    // Add example messages to the Research chat
    await db.insert(schema.messages).values([
      {
        chatId: researchChat.id,
        content: "As-Salaam-Alaykum. I'm in Research Mode to provide detailed academic insights about Islamic topics with proper citations. How may I assist your scholarly inquiries today?",
        sender: "ai"
      },
      {
        chatId: researchChat.id,
        content: "I'm researching the contributions of Al-Ghazali to Islamic philosophy and spiritual practice. Could you provide an overview of his most important works and their influence?",
        sender: "user"
      },
      {
        chatId: researchChat.id,
        content: `Wa Alaikum Assalam. I'd be delighted to provide an overview of Imam Al-Ghazali's contributions to Islamic philosophy and spirituality.

## Abu Hamid Muhammad ibn Muhammad al-Ghazali (1058-1111 CE)

Al-Ghazali, honorifically referred to as Hujjat al-Islam (Proof of Islam), was one of the most prominent and influential Muslim philosophers, theologians, jurists, and mystics of Sunni Islam. His contributions span multiple disciplines and have shaped Islamic thought for nearly a millennium.

### Major Works and Contributions

#### 1. **Ihya Ulum al-Din (Revival of Religious Sciences)**
This is widely considered Al-Ghazali's magnum opus and one of the most influential works in Islamic history. This comprehensive work consists of four volumes:
- **Acts of Worship** (Rub' al-'Ibadat)
- **Norms of Daily Life** (Rub' al-'Adat)
- **The Ways to Perdition** (Rub' al-Muhlikat)
- **The Ways to Salvation** (Rub' al-Munjiyat)

The Ihya represents Al-Ghazali's attempt to reconcile the exoteric and esoteric aspects of Islam, combining law, theology, and Sufism into a cohesive framework for spiritual development (Montgomery Watt, 1953).

#### 2. **Al-Munqidh min al-Dalal (Deliverance from Error)**
This autobiographical work details Al-Ghazali's spiritual crisis and intellectual journey through various schools of thought. It chronicles his skepticism toward philosophical methods, his spiritual awakening, and his eventual embrace of Sufism. This text is pivotal for understanding his intellectual evolution (McCarthy, 2000).

#### 3. **Tahafut al-Falasifa (The Incoherence of the Philosophers)**
In this critical work, Al-Ghazali challenges the metaphysical claims of Hellenistic philosophers, particularly Avicenna (Ibn Sina). He identifies 20 propositions where philosophers contradicted Islamic doctrines, declaring three of these positions as heretical: the eternity of the world, God's knowledge of particulars, and bodily resurrection (Marmura, 1997).

#### 4. **Maqasid al-Falasifa (The Aims of the Philosophers)**
Written before Tahafut, this work presents a fair summary of philosophical doctrines before his critique. It demonstrates Al-Ghazali's deep understanding of the philosophical traditions he later critiqued (Hourani, 1958).

### Intellectual and Spiritual Influence

#### 1. **Reconciliation of Islamic Orthodoxy and Sufism**
Perhaps Al-Ghazali's most enduring legacy is his successful integration of Sufism (Islamic mysticism) into mainstream Sunni orthodoxy. Before him, there was significant tension between jurists and mystics; after him, moderate Sufism became an accepted dimension of Sunni Islam (Karamustafa, 2007).

#### 2. **Critique of Philosophy**
Al-Ghazali's critique of Greek-influenced Islamic philosophy significantly altered its trajectory in the Islamic world. While not ending philosophical inquiry, he forced subsequent philosophers like Ibn Rushd (Averroes) to respond to his challenges and reconsider their approach to metaphysics and theology (Griffel, 2009).

#### 3. **Islamic Education Reform**
Through the Ihya, Al-Ghazali reformed Islamic education by emphasizing the spiritual and ethical dimensions of religious knowledge, not merely its legal aspects. He criticized scholars who pursued knowledge for worldly gain rather than spiritual benefit (Alavi, 1988).

#### 4. **Methodology in Islamic Jurisprudence**
Al-Ghazali's work in usul al-fiqh (principles of Islamic jurisprudence), particularly his book Al-Mustasfa, refined the methodology of legal reasoning in the Shafi'i school and beyond (Hallaq, 1984).

#### 5. **Western Influence**
Al-Ghazali's works, particularly the Maqasid, were translated into Latin and influenced medieval Christian scholastics such as Thomas Aquinas and Pascal (Durant, 1950).

Would you like me to elaborate further on any specific aspect of Al-Ghazali's thought or legacy?

**References:**
- Watt, W. M. (1953). *The Faith and Practice of Al-Ghazali*.
- McCarthy, R. J. (2000). *Al-Ghazali's Path to Sufism: His Deliverance from Error*.
- Marmura, M. E. (1997). "Al-Ghazali's The Incoherence of the Philosophers."
- Hourani, G. F. (1958). "The Chronology of Al-Ghazali's Writings."
- Karamustafa, A. T. (2007). *Sufism: The Formative Period*.
- Griffel, F. (2009). *Al-Ghazali's Philosophical Theology*.
- Alavi, S. M. Z. (1988). *Muslim Educational Thought in the Middle Ages*.
- Hallaq, W. B. (1984). "Was the Gate of Ijtihad Closed?"
- Durant, W. (1950). *The Age of Faith*.`,
        sender: "ai"
      }
    ]);

    console.log("Added example messages to chats");

    // Create example research documents
    await db.insert(schema.documents).values([
      {
        title: "Principles of Islamic Jurisprudence",
        author: "Dr. Mohammed Al-Farabi",
        category: "Fiqh",
        description: "A comprehensive guide to the principles of Islamic jurisprudence across different madhabs",
        fileUrl: "uploads/document-sample-1.pdf",
        fileType: "application/pdf",
        uploadedById: adminUser.id
      },
      {
        title: "The Science of Hadith Verification",
        author: "Dr. Aisha Rahman",
        category: "Hadith Studies",
        description: "An academic exploration of hadith authentication methods",
        fileUrl: "uploads/document-sample-2.pdf",
        fileType: "application/pdf",
        uploadedById: adminUser.id
      },
      {
        title: "Early Islamic Mysticism: Origins and Development",
        author: "Prof. Ahmad Al-Jilani",
        category: "Tasawwuf",
        description: "A historical analysis of Sufi practices in the early Islamic period",
        fileUrl: "uploads/document-sample-3.pdf",
        fileType: "application/pdf",
        uploadedById: adminUser.id
      }
    ]);

    console.log("Added example research documents");

    console.log("Seed process completed successfully!");
  } catch (error) {
    console.error("Error during seed process:", error);
  }
}

seed();
