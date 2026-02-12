import Question from "core/types/Question";
import html2pdf from "html2pdf.js";
import { render_template } from "./TemplatingService";

const htmlTemplate: string = `<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">

    <style>
        @page {
            size: A4;
            margin: 0;
        }

        body {
            margin: 0;
            font-family: "Inter", "Segoe UI", sans-serif;
        }

        .page {
            height: 297mm;
            display: flex;
            flex-direction: column;
        }

        .card {
            flex: 1;
            padding: 24mm 20mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
        }

        .card:not(:last-child)::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 10mm;
            right: 10mm;
            border-bottom: 1px dashed #999;
        }

        .label {
            font-size: 12px;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: #888;
            margin-bottom: 12px;
            text-align: center;
        }

        .content {
            font-size: 22px;
            line-height: 1.4;
            text-align: center;
            color: #222;
            font-weight: 600;
        }

        .answer {
            font-size: 18px;
            font-weight: 400;
        }

        .page-break {
            page-break-after: always;
        }
    </style>
</head>

<body>

{{#each pages}}

    <!-- QUESTIONS PAGE -->
    <div class="page">
        {{#each this}}
        <div class="card">
            <div class="label">Question</div>
            <div class="content">
                {{question}}
            </div>
        </div>
        {{/each}}
    </div>

    <div class="page-break"></div>

    <!-- ANSWERS PAGE -->
    <div class="page">
        {{#each this}}
        <div class="card">
            <div class="label">Answer</div>
            <div class="content answer">
                {{answer}}
            </div>
        </div>
        {{/each}}
    </div>

    {{#unless @last}}
    <div class="page-break"></div>
    {{/unless}}

{{/each}}

</body>

</html>
`;

const CARDS_PER_PAGE = 3;

function chunkCards(cards: Question[], size: number) {
	const chunks: Question[][] = [];

	for (let i = 0; i < cards.length; i += size) {
		const chunk = cards.slice(i, i + size);

		while (chunk.length < size) {
			chunk.push({
				question: "",
				answer: "",
				attributes: [],
				tags: [],
			});
		}

		chunks.push(chunk);
	}

	return chunks;
}

export async function generatePDFForQuestions(
	questions: Question[],
	outputPath: string,
) {
	const pages = chunkCards(questions, CARDS_PER_PAGE);
	const htmlString = render_template(htmlTemplate, { pages });

	//console.log(html);

	// Create hidden container
	// const container = document.createElement("div");
	// container.innerHTML = html;
	// document.body.appendChild(container);

	// await html2pdf()
	// 	.from(container)
	// 	.set({
	// 		margin: 0,
	// 		filename: "question_cards.pdf",
	// 		html2canvas: {
	// 			scale: 2,
	// 		},
	// 		jsPDF: {
	// 			unit: "mm",
	// 			format: "a4",
	// 			orientation: "portrait",
	// 		},
	// 	})
	// 	.save();

	// container.remove();
}
