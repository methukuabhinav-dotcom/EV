document.addEventListener("DOMContentLoaded", () => {
  const questions = document.querySelectorAll(".faq-question");

  questions.forEach(question => {
    question.addEventListener("click", () => {
      const answer = question.nextElementSibling;

      // Close other answers
      document.querySelectorAll(".faq-answer").forEach(item => {
        if (item !== answer) {
          item.style.display = "none";
        }
      });

      // Toggle current answer
      answer.style.display =
        answer.style.display === "block" ? "none" : "block";
    });
  });
});
