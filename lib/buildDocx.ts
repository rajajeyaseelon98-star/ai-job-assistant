import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";
import type { ImprovedResumeContent } from "@/types/analysis";

export async function buildImprovedResumeDocx(content: ImprovedResumeContent): Promise<Buffer> {
  const children: Paragraph[] = [];
  children.push(
    new Paragraph({ text: "Professional Summary", heading: HeadingLevel.HEADING_1 })
  );
  children.push(
    new Paragraph({ children: [new TextRun({ text: content.summary || "" })] })
  );
  children.push(new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_1 }));
  children.push(
    new Paragraph({
      children: [new TextRun({ text: content.skills?.join(", ") || "" })],
    })
  );
  for (const exp of content.experience || []) {
    children.push(
      new Paragraph({
        text: `${exp.title} — ${exp.company}`,
        heading: HeadingLevel.HEADING_2,
      })
    );
    for (const b of exp.bullets || []) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: b })],
        })
      );
    }
  }
  if (content.projects?.length) {
    children.push(new Paragraph({ text: "Projects", heading: HeadingLevel.HEADING_1 }));
    for (const proj of content.projects) {
      children.push(
        new Paragraph({ text: proj.name, heading: HeadingLevel.HEADING_2 })
      );
      if (proj.description) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: proj.description })],
          })
        );
      }
      for (const b of proj.bullets || []) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: b })],
          })
        );
      }
    }
  }
  children.push(new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_1 }));
  children.push(
    new Paragraph({
      children: [new TextRun({ text: content.education || "" })],
    })
  );

  // Watermark / branding
  children.push(new Paragraph({ text: "" }));
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Created with AI Job Assistant",
          size: 16,
          color: "999999",
          italics: true,
        }),
      ],
    })
  );

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
