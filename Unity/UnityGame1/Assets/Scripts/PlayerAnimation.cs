using UnityEngine;
using UnityEngine.InputSystem;

public class PlayerAnimation : MonoBehaviour
{
    [SerializeField] private Animator animator;

    private static readonly int JumpParameter = Animator.StringToHash("jump");
    private static readonly int RunParameter = Animator.StringToHash("run");

    private void Awake()
    {
        if (animator == null)
        {
            animator = GetComponent<Animator>();
        }

        if (animator == null)
        {
            Debug.LogError("PlayerAnimation wymaga komponentu Animator.", this);
            enabled = false;
        }
    }

    private void Update()
    {
        Keyboard keyboard = Keyboard.current;
        if (keyboard == null)
        {
            return;
        }

        // 1. Obsługa animacji biegu (A/D lub strzałki lewo/prawo)
        bool isMoving = keyboard.aKey.isPressed ||
                        keyboard.dKey.isPressed ||
                        keyboard.leftArrowKey.isPressed ||
                        keyboard.rightArrowKey.isPressed;

        animator.SetBool(RunParameter, isMoving);

        // 2. Obsługa animacji skoku (Spacja, W lub strzałka w górę)
        if (keyboard.spaceKey.wasPressedThisFrame ||
            keyboard.wKey.wasPressedThisFrame ||
            keyboard.upArrowKey.wasPressedThisFrame)
        {
            animator.SetTrigger(JumpParameter);
        }
    }
}