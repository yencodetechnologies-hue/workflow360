// lib/screens/profile_screen.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/auth_service.dart';
import '../services/user_api.dart';
import '../utils/app_theme.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = true;
  bool _saving = false;
  String? _error;
  String? _success;

  // Form controllers
  final _contactNameCtrl = TextEditingController();
  final _loginIdCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _roleCtrl = TextEditingController();
  final _godownIdCtrl = TextEditingController();
  final _siteNameCtrl = TextEditingController();
  final _siteAddressCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();

  String _userRole = 'ADMIN';
  String _userInitial = 'U';
  String _displayName = 'User';

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _contactNameCtrl.dispose();
    _loginIdCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _roleCtrl.dispose();
    _godownIdCtrl.dispose();
    _siteNameCtrl.dispose();
    _siteAddressCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    setState(() {
      _loading = true;
      _error = null;
      _success = null;
    });

    try {
      final profile = await UserApi.getMyProfile();
      
      _userRole = profile['role'] as String? ?? 'ADMIN';
      final email = profile['email'] as String? ?? '';
      final loginId = profile['loginId'] as String? ?? '';
      final contactName = profile['contactName'] as String? ?? '';

      _contactNameCtrl.text = contactName;
      _loginIdCtrl.text = loginId;
      _emailCtrl.text = email;
      _phoneCtrl.text = profile['contactPhone'] as String? ?? '';
      _roleCtrl.text = _roleLabel(_userRole);
      _godownIdCtrl.text = profile['godownId'] as String? ?? '';
      _siteNameCtrl.text = profile['siteName'] as String? ?? '';
      _siteAddressCtrl.text = profile['siteAddress'] as String? ?? '';
      _passwordCtrl.clear();
      _confirmPasswordCtrl.clear();

      final initialBase = email.isNotEmpty ? email : (loginId.isNotEmpty ? loginId : 'U');
      _userInitial = initialBase.substring(0, 1).toUpperCase();
      _displayName = contactName.isNotEmpty ? contactName : (email.isNotEmpty ? email : _roleLabel(_userRole));

      // Also refresh cached session
      final currentUser = AuthUser(
        id: profile['id'] as String,
        role: _userRole,
        email: email.isNotEmpty ? email : null,
        loginId: loginId.isNotEmpty ? loginId : null,
        godownId: profile['godownId'] as String?,
        godownName: profile['godownName'] as String?,
        siteName: profile['siteName'] as String?,
        siteAddress: profile['siteAddress'] as String?,
        contactPhone: profile['contactPhone'] as String?,
        contactName: contactName.isNotEmpty ? contactName : null,
      );
      await AuthService.updateCachedUser(currentUser);

    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '').replaceFirst('ApiException: ', '');
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _saving = true;
      _error = null;
      _success = null;
    });

    if (_passwordCtrl.text.isNotEmpty && _passwordCtrl.text != _confirmPasswordCtrl.text) {
      setState(() {
        _error = 'Passwords do not match';
        _saving = false;
      });
      return;
    }

    try {
      final body = <String, dynamic>{
        'email': _emailCtrl.text.trim(),
        'loginId': _loginIdCtrl.text.trim(),
        'contactName': _contactNameCtrl.text.trim(),
        'contactPhone': _phoneCtrl.text.trim(),
      };

      final showSiteFields = _userRole == 'BILLER' || _userRole == 'GODOWN';
      final showGodownId = _userRole == 'GODOWN';

      if (showSiteFields) {
        body['siteName'] = _siteNameCtrl.text.trim();
        body['siteAddress'] = _siteAddressCtrl.text.trim();
      }

      if (showGodownId) {
        body['godownId'] = _godownIdCtrl.text.trim();
      }

      if (_passwordCtrl.text.isNotEmpty) {
        body['password'] = _passwordCtrl.text;
      }

      final res = await UserApi.updateMyProfile(body);
      
      setState(() {
        _success = res['message'] as String? ?? 'Profile updated successfully';
        _passwordCtrl.clear();
        _confirmPasswordCtrl.clear();
      });

      // Reload profile to refresh cached data and initial letter state
      await _loadProfile();

    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '').replaceFirst('ApiException: ', '');
      });
    } finally {
      setState(() {
        _saving = false;
      });
    }
  }

  String _roleLabel(String role) {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'GODOWN':
        return 'Godown operator';
      case 'BILLER':
        return 'Biller';
      case 'DELIVERY':
        return 'Delivery person';
      default:
        return role;
    }
  }

  String _roleBadge(String role) {
    switch (role) {
      case 'ADMIN':
        return 'Full admin access';
      case 'GODOWN':
        return 'Godown access';
      case 'BILLER':
        return 'Biller access';
      case 'DELIVERY':
        return 'Delivery access';
      default:
        return 'Account access';
    }
  }

  @override
  Widget build(BuildContext context) {
    final showSiteFields = _userRole == 'BILLER' || _userRole == 'GODOWN';
    final showGodownId = _userRole == 'GODOWN';

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          'My profile',
          style: GoogleFonts.spaceGrotesk(
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
        backgroundColor: AppColors.surface,
        elevation: 0.5,
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : SingleChildScrollView(
              child: Column(
                children: [
                  // Gradient banner & Avatar Header
                  Stack(
                    alignment: Alignment.center,
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        height: 120,
                        width: double.infinity,
                        decoration: const BoxDecoration(
                          gradient: AppGradients.primary,
                        ),
                      ),
                      Positioned(
                        bottom: -40,
                        child: Container(
                          width: 88,
                          height: 88,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                            border: Border.all(color: Colors.white, width: 4),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.08),
                                blurRadius: 16,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: CircleAvatar(
                            backgroundColor: AppColors.bgAlt,
                            child: Text(
                              _userInitial,
                              style: GoogleFonts.spaceGrotesk(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 52),

                  // Display Name and Role Badge
                  Text(
                    _displayName,
                    style: GoogleFonts.spaceGrotesk(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppColors.text,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
                    ),
                    child: Text(
                      _roleBadge(_userRole),
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Success & Error notifications
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.red.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.red.withValues(alpha: 0.15)),
                        ),
                        child: Text(
                          _error!,
                          style: GoogleFonts.inter(color: AppColors.red, fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ),
                  if (_success != null)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
                        ),
                        child: Text(
                          _success!,
                          style: GoogleFonts.inter(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                      ),
                    ),

                  // Form Details Card
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Card(
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                              side: const BorderSide(color: AppColors.border),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(20),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Text(
                                    'Account details',
                                    style: GoogleFonts.spaceGrotesk(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.text,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  TextFormField(
                                    controller: _contactNameCtrl,
                                    decoration: const InputDecoration(labelText: 'Contact name'),
                                  ),
                                  const SizedBox(height: 14),
                                  TextFormField(
                                    controller: _loginIdCtrl,
                                    decoration: const InputDecoration(labelText: 'Login ID'),
                                    validator: (val) =>
                                        (val == null || val.trim().isEmpty) ? 'Login ID is required' : null,
                                  ),
                                  const SizedBox(height: 14),
                                  TextFormField(
                                    controller: _emailCtrl,
                                    decoration: const InputDecoration(labelText: 'Email address'),
                                    keyboardType: TextInputType.emailAddress,
                                  ),
                                  const SizedBox(height: 14),
                                  TextFormField(
                                    controller: _phoneCtrl,
                                    decoration: const InputDecoration(labelText: 'Phone number'),
                                    keyboardType: TextInputType.phone,
                                  ),
                                  const SizedBox(height: 14),
                                  TextFormField(
                                    controller: _roleCtrl,
                                    decoration: const InputDecoration(
                                      labelText: 'Role',
                                      fillColor: Color(0xFFF1F5F9), // read-only background
                                    ),
                                    readOnly: true,
                                    enabled: false,
                                  ),
                                  if (showGodownId) ...[
                                    const SizedBox(height: 14),
                                    TextFormField(
                                      controller: _godownIdCtrl,
                                      decoration: const InputDecoration(labelText: 'Godown ID'),
                                    ),
                                  ],
                                  if (showSiteFields) ...[
                                    const SizedBox(height: 14),
                                    TextFormField(
                                      controller: _siteNameCtrl,
                                      decoration: const InputDecoration(labelText: 'Site name'),
                                    ),
                                    const SizedBox(height: 14),
                                    TextFormField(
                                      controller: _siteAddressCtrl,
                                      decoration: const InputDecoration(labelText: 'Site address'),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Security Card
                          Card(
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                              side: const BorderSide(color: AppColors.border),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(20),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Text(
                                    'Update password',
                                    style: GoogleFonts.spaceGrotesk(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.text,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Leave blank to keep current password',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      color: AppColors.subtext,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  TextFormField(
                                    controller: _passwordCtrl,
                                    decoration: const InputDecoration(labelText: 'New password'),
                                    obscureText: true,
                                  ),
                                  const SizedBox(height: 14),
                                  TextFormField(
                                    controller: _confirmPasswordCtrl,
                                    decoration: const InputDecoration(labelText: 'Confirm password'),
                                    obscureText: true,
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Save Button
                          ElevatedButton(
                            onPressed: _saving ? null : _saveProfile,
                            child: _saving
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                  )
                                : const Text('Save changes'),
                          ),
                          const SizedBox(height: 32),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
