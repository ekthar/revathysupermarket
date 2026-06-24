import 'package:flutter/material.dart';

/// New support ticket form.
class NewTicketScreen extends StatefulWidget {
  const NewTicketScreen({
    super.key,
    this.orders = const [],
    this.onSubmit,
    this.isLoading = false,
  });

  final List<Map<String, dynamic>> orders;
  final void Function(String subject, String message, String? orderId)? onSubmit;
  final bool isLoading;

  @override
  State<NewTicketScreen> createState() => _NewTicketScreenState();
}

class _NewTicketScreenState extends State<NewTicketScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  String? _selectedOrderId;

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  void _handleSubmit() {
    if (!_formKey.currentState!.validate()) return;
    widget.onSubmit?.call(
      _subjectController.text.trim(),
      _messageController.text.trim(),
      _selectedOrderId,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New Ticket')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _subjectController,
              decoration: InputDecoration(
                labelText: 'Subject',
                hintText: 'Brief description of your issue',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              validator: (v) =>
                  v == null || v.trim().length < 3 ? 'Please provide a subject' : null,
            ),
            const SizedBox(height: 16),
            if (widget.orders.isNotEmpty) ...[
              DropdownButtonFormField<String?>(
                value: _selectedOrderId,
                decoration: InputDecoration(
                  labelText: 'Related Order (Optional)',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                items: [
                  const DropdownMenuItem(
                    value: null,
                    child: Text('None'),
                  ),
                  ...widget.orders.map((o) => DropdownMenuItem(
                        value: o['id'] as String,
                        child: Text('#${o['orderNumber']}'),
                      )),
                ],
                onChanged: (v) => setState(() => _selectedOrderId = v),
              ),
              const SizedBox(height: 16),
            ],
            TextFormField(
              controller: _messageController,
              maxLines: 5,
              decoration: InputDecoration(
                labelText: 'Message',
                hintText: 'Describe your issue in detail',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                alignLabelWithHint: true,
              ),
              validator: (v) =>
                  v == null || v.trim().length < 5 ? 'Please provide more detail' : null,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: widget.isLoading ? null : _handleSubmit,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: widget.isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Submit Ticket'),
            ),
          ],
        ),
      ),
    );
  }
}
