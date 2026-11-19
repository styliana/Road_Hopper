using TMPro;
using UnityEngine;

public class ScoreManager : MonoBehaviour
{
    [SerializeField] private TMP_Text scoreText;
    [SerializeField] private TMP_Text messageText;

    private int score;

    private void Awake()
    {
        if (scoreText == null)
        {
            Debug.LogError("ScoreManager: przypisz pole Score Text w Inspectorze.", this);
        }

        if (messageText == null)
        {
            Debug.LogError("ScoreManager: przypisz pole Message Text w Inspectorze.", this);
        }

        RefreshScore();
    }

    public void AddPoints(int amount)
    {
        score += amount;
        RefreshScore();
        SetMessage(amount >= 0
            ? "Zebrano przedmiot: +" + amount + " pkt"
            : "Kolizja z przeszkodą: " + amount + " pkt");
    }

    public void SetMessage(string message)
    {
        if (messageText == null)
        {
            Debug.LogError("ScoreManager nie ma przypisanego pola Message Text.", this);
            return;
        }

        messageText.text = message;
    }

    private void RefreshScore()
    {
        if (scoreText != null)
        {
            scoreText.text = "Punkty: " + score;
        }
    }
}
