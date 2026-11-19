using UnityEngine;

public class TriggerZone : MonoBehaviour
{
    [SerializeField] private ScoreManager scoreManager;
    [SerializeField] private Transform animatedObject;
    [SerializeField] private float rotationSpeed = 90f;
    [SerializeField] private string messageOnExit = "Opuściłeś strefę.";

    private bool playerInside;
    private Quaternion initialRotation;

    private void Awake()
    {
        if (scoreManager == null)
        {
            scoreManager = FindAnyObjectByType<ScoreManager>();
        }

        if (scoreManager == null)
        {
            Debug.LogError("TriggerZone wymaga obiektu ze skryptem ScoreManager.", this);
        }

        if (animatedObject != null)
        {
            initialRotation = animatedObject.rotation;
        }
    }

    private void Update()
    {
        if (playerInside && animatedObject != null)
        {
            animatedObject.Rotate(0f, 0f, rotationSpeed * Time.deltaTime);
        }
    }

    private void OnTriggerEnter2D(Collider2D other)
    {
        if (!other.CompareTag("Player"))
        {
            return;
        }

        playerInside = true;
        if (scoreManager != null)
        {
            scoreManager.SetMessage("Strefa aktywowana!");
        }
    }

    private void OnTriggerExit2D(Collider2D other)
    {
        if (!other.CompareTag("Player"))
        {
            return;
        }

        playerInside = false;
        if (animatedObject != null)
        {
            animatedObject.rotation = initialRotation;
        }

        if (scoreManager != null)
        {
            scoreManager.SetMessage(messageOnExit);
        }
    }
}
